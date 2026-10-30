import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime, timedelta
from pyproj import Transformer
from shapely import wkt
import os

DB_USER = "admin"
DB_PASSWORD = "adminpassword"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "rotasdf"
engine = create_engine(f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

PASTA_ATUAL = os.path.dirname(os.path.abspath(__file__))
PASTA_DATA = os.path.join(PASTA_ATUAL, "data")

ARQ_PARADAS = os.path.join(PASTA_DATA, "paradas.csv")
ARQ_VIAGENS = os.path.join(PASTA_DATA, "viagens.csv")
ARQ_HORARIOS = os.path.join(PASTA_DATA, "horarios.csv")
ARQ_PERCURSOS = os.path.join(PASTA_DATA, "percursos.csv")

transformer = Transformer.from_crs("EPSG:31983", "EPSG:4326", always_xy=True)

def limpar_coordenada_ponto(wkt_string):
    wkt_limpo = str(wkt_string).strip('"').strip("'").strip()
    nums = wkt_limpo.replace("POINT (", "").replace(")", "").split()
    x_utm, y_utm = float(nums[0]), float(nums[1])
    lon, lat = transformer.transform(x_utm, y_utm)
    return lat, lon

def parse_horario(hr_str):
    hr_str = str(hr_str).strip()
    if len(hr_str) == 5: 
        hr_str += ":00"
    
    partes = hr_str.split(':')
    hora = int(partes[0])
    
    if hora >= 24:
        hora = hora - 24
        hr_str = f"{hora:02d}:{partes[1]}:{partes[2]}"
        
    return datetime.strptime(hr_str, '%H:%M:%S')

def importar_dados():
    print("Lendo os arquivos...")
    df_paradas_raw = pd.read_csv(ARQ_PARADAS, sep=',', encoding='utf-8')
    df_horarios_raw = pd.read_csv(ARQ_HORARIOS, sep=',', encoding='utf-8', dtype={'cd_linha': str})
    df_viagens_raw = pd.read_csv(ARQ_VIAGENS, sep=',', encoding='utf-8', dtype={'cd_linha': str})
    df_percursos = pd.read_csv(ARQ_PERCURSOS, sep=',', encoding='utf-8', dtype={'cd_linha': str})

    print("Processando Paradas e Geometrias...")
    df_paradas_raw['geometry'] = df_paradas_raw['geo_ponto_rede_pto'].apply(
        lambda x: wkt.loads(str(x).strip('"').strip("'").strip())
    )
    
    print("Cruzando traçados das linhas com as paradas...")
    paradas_por_linha = {}
    
    for _, row in df_percursos.iterrows():
        cd_linha = str(row['cd_linha']).strip()
        sentido_geo = str(row['lin_sentido']).strip().upper()
        sentido = 'IDA' if sentido_geo in ['IDA', 'I', 'C'] else 'VOLTA'
        
        wkt_linha = str(row['geo_linhas_lin_31983']).strip('"').strip("'").strip()
        linha_geom = wkt.loads(wkt_linha)
            
        buffer_linha = linha_geom.buffer(50)
            
        mask = df_paradas_raw['geometry'].apply(lambda p: p.intersects(buffer_linha))
        paradas_na_linha = df_paradas_raw[mask].copy()
            
        if not paradas_na_linha.empty:
            paradas_na_linha['dist_trajeto'] = paradas_na_linha['geometry'].apply(lambda p: linha_geom.project(p))
            paradas_na_linha = paradas_na_linha.sort_values('dist_trajeto')
            chave = f"{cd_linha}_{sentido}"
            paradas_por_linha[chave] = paradas_na_linha['parada'].astype(str).tolist()

    print(f"-> Itinerários mapeados: {len(paradas_por_linha)}.")

    print("Inserindo Paradas no Banco...")
    paradas_lista = []
    for _, row in df_paradas_raw.iterrows():
        lat, lon = limpar_coordenada_ponto(row['geo_ponto_rede_pto'])
        paradas_lista.append({
            "id": str(row['parada']).strip(),
            "codigo": str(row['parada']).strip(),
            "nome": str(row['descricao']).strip(),
            "latitude": lat,
            "longitude": lon
        })
    df_paradas_db = pd.DataFrame(paradas_lista).drop_duplicates(subset=['id'])
    df_paradas_db.to_sql('paradas', engine, if_exists='append', index=False)

    print("Inserindo Linhas no Banco...")
    df_linhas_viagens = df_viagens_raw[['cd_linha', 'tx_denominacao_linha']].copy()
    df_linhas_viagens.columns = ['id', 'nome']
    
    df_linhas_horarios = df_horarios_raw[['cd_linha']].copy()
    df_linhas_horarios.columns = ['id']
    df_linhas_horarios['nome'] = "Linha " + df_linhas_horarios['id']
    
    df_todas_linhas = pd.concat([df_linhas_viagens, df_linhas_horarios], ignore_index=True)
    df_todas_linhas['id'] = df_todas_linhas['id'].astype(str).str.strip()
    df_todas_linhas['nome'] = df_todas_linhas['nome'].astype(str).str.strip()
    df_linhas = df_todas_linhas.drop_duplicates(subset=['id'])
    
    df_linhas['codigo'] = df_linhas['id']
    df_linhas['cor'] = 'FFFFFF'
    df_linhas.to_sql('linhas', engine, if_exists='append', index=False)

    df_calendarios = pd.DataFrame([
        {"id": "CAL_UTIL", "tipo_dia": "DIA_UTIL", "inicio": "2026-01-01", "fim": "2026-12-31"},
        {"id": "CAL_SAB", "tipo_dia": "SABADO", "inicio": "2026-01-01", "fim": "2026-12-31"},
        {"id": "CAL_DOM", "tipo_dia": "DOMINGO_FERIADO", "inicio": "2026-01-01", "fim": "2026-12-31"}
    ])
    df_calendarios.to_sql('calendario', engine, if_exists='append', index=False)

    print("Processando Viagens e Horários...")
    viagens_lista = []
    horarios_lista = []
    contador_viagem = 1
    viagens_ignoradas = 0

    for _, row in df_horarios_raw.iterrows():
        linha_id = str(row['cd_linha']).strip()
        sentido_raw = str(row['sentido']).strip().upper()
        sentido = 'IDA' if sentido_raw in ['I', 'IDA', '0', 'C'] else 'VOLTA'
        
        chave_busca = f"{linha_id}_{sentido}"
        
        if chave_busca not in paradas_por_linha:
            viagens_ignoradas += 1
            continue

        trip_id = f"TRIP_{contador_viagem}"
        
        dias_semana = str(row.get('dias_semana', 'SSSSSNN')).strip()
        cal_id = "CAL_UTIL"
        if dias_semana.endswith("S") and not dias_semana.startswith("S"):
            cal_id = "CAL_DOM"
        elif dias_semana == "NNNNNNS":
            cal_id = "CAL_SAB"

        viagens_lista.append({
            "id": trip_id, "linha_id": linha_id, "calendario_id": cal_id,
            "sentido": sentido, "destino": "Destino Final"
        })

        hr_str = str(row['hr_prevista']).strip()
        
        hr_saida = parse_horario(hr_str)

        tempo_total = int(row['tempo_percurso']) if pd.notna(row['tempo_percurso']) else 60
        paradas_itinerario = paradas_por_linha[chave_busca]

        num_paradas = len(paradas_itinerario)
        tempo_entre_paradas = tempo_total / max((num_paradas - 1), 1)

        for seq, parada_id in enumerate(paradas_itinerario):
            tempo_decorrido = tempo_entre_paradas * seq
            horario_parada = hr_saida + timedelta(minutes=tempo_decorrido)

            if horario_parada.day > hr_saida.day:
                horario_parada = horario_parada - timedelta(days=1)

            horarios_lista.append({
                "viagem_id": trip_id, "parada_id": parada_id, "sequencia": seq + 1,
                "partida": horario_parada.strftime('%H:%M:%S'), 
                "chegada": horario_parada.strftime('%H:%M:%S')
            })

        contador_viagem += 1

        if len(viagens_lista) >= 500:
            pd.DataFrame(viagens_lista).to_sql('viagens', engine, if_exists='append', index=False)
            pd.DataFrame(horarios_lista).to_sql('horarios_paradas', engine, if_exists='append', index=False)
            viagens_lista = []
            horarios_lista = []

    if viagens_lista:
        pd.DataFrame(viagens_lista).to_sql('viagens', engine, if_exists='append', index=False)
        pd.DataFrame(horarios_lista).to_sql('horarios_paradas', engine, if_exists='append', index=False)

    print(f"-> SUCESSO! {contador_viagem - 1} viagens inseridas.")
    print(f"-> Aviso: {viagens_ignoradas} viagens ignoradas por falta de itinerário no arquivo original.")

if __name__ == "__main__":
    importar_dados()