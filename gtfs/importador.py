import os
from datetime import date, datetime, timedelta

import pandas as pd
from psycopg2.extras import execute_values
from pyproj import Transformer
from shapely import wkt
from shapely.strtree import STRtree
from sqlalchemy import create_engine, text

PASTA_ATUAL = os.path.dirname(os.path.abspath(__file__))
PASTA_RAIZ = os.path.dirname(PASTA_ATUAL)
PASTA_DATA = os.path.join(PASTA_ATUAL, "data")

ARQ_PARADAS = os.path.join(PASTA_DATA, "paradas.csv")
ARQ_VIAGENS = os.path.join(PASTA_DATA, "viagens.csv")
ARQ_HORARIOS = os.path.join(PASTA_DATA, "horarios.csv")
ARQ_PERCURSOS = os.path.join(PASTA_DATA, "percursos.csv")


def carregar_env_local():
    for caminho in (os.path.join(PASTA_RAIZ, ".env"), os.path.join(PASTA_RAIZ, "api", ".env")):
        if not os.path.isfile(caminho):
            continue
        with open(caminho, "r", encoding="utf-8") as arq:
            for linha in arq:
                linha = linha.strip()
                if not linha or linha.startswith("#") or "=" not in linha:
                    continue
                chave, valor = linha.split("=", 1)
                chave = chave.strip()
                valor = valor.strip().strip('"').strip("'")
                os.environ.setdefault(chave, valor)


def criar_engine():
    carregar_env_local()
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return create_engine(database_url)

    db_user = os.getenv("DB_USER", "admin")
    db_password = os.getenv("DB_PASSWORD", "adminpassword")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "rotasdf")
    return create_engine(
        f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    )


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

    partes = hr_str.split(":")
    hora = int(partes[0])

    if hora >= 24:
        hora = hora - 24
        hr_str = f"{hora:02d}:{partes[1]}:{partes[2]}"

    return datetime.strptime(hr_str, "%H:%M:%S")


def definir_cor_bacia(nm_operadora):
    texto = str(nm_operadora or "").upper()
    if "BACIA 01" in texto or "BACIA - 01" in texto or "PIRACICABANA" in texto:
        return "#1565C0"
    if "BACIA 02" in texto or "BACIA - 02" in texto or "PIONEIRA" in texto or "COOBRATAETE" in texto:
        return "#D97706"
    if "BACIA 03" in texto or "BACIA - 03" in texto or "URBI" in texto:
        return "#00796B"
    if "BACIA 04" in texto or "BACIA - 04" in texto or "MARECHAL" in texto:
        return "#E65100"
    if "BACIA 05" in texto or "BACIA - 05" in texto or "SÃO JOSÉ" in texto or "SAO JOSE" in texto or "BSBUS" in texto:
        return "#2E7D32"
    return "#006666"


def normalizar_operadora(nm_operadora):
    texto = limpar_texto(nm_operadora)
    if not texto:
        return None
    upper = texto.upper()
    if "PIRACICABANA" in upper or "BACIA 01" in upper or "BACIA - 01" in upper:
        return "Piracicabana · Bacia 01"
    if "COOBRATAETE" in upper:
        return "Coobrataete · Bacia 02"
    if "PIONEIRA" in upper or "BACIA 02" in upper or "BACIA - 02" in upper:
        return "Pioneira · Bacia 02"
    if "URBI" in upper or "BACIA 03" in upper or "BACIA - 03" in upper:
        return "Urbi · Bacia 03"
    if "MARECHAL" in upper or "BACIA 04" in upper or "BACIA - 04" in upper:
        return "Marechal · Bacia 04"
    if "SÃO JOSÉ" in upper or "SAO JOSE" in upper or "BSBUS" in upper or "BACIA 05" in upper or "BACIA - 05" in upper:
        return "São José · Bacia 05"
    return "Transporte Complementar (STPCR)"


def limpar_texto(valor):
    if pd.isna(valor):
        return None
    texto = str(valor).strip()
    if not texto or texto.lower() == "nan":
        return None
    return texto


def horario_esta_vigente(dt_final, hoje=None):
    hoje = hoje or date.today()
    texto = limpar_texto(dt_final)
    if not texto:
        return True
    try:
        data_fim = datetime.strptime(texto[:10], "%Y-%m-%d").date()
        return data_fim >= hoje
    except ValueError:
        return True


def garantir_colunas_enriquecidas(engine):
    comandos = [
        "ALTER TABLE linhas ADD COLUMN IF NOT EXISTS tarifa NUMERIC(6,2);",
        "ALTER TABLE linhas ADD COLUMN IF NOT EXISTS faixa_tarifaria VARCHAR(50);",
        "ALTER TABLE linhas ADD COLUMN IF NOT EXISTS operadora VARCHAR(120);",
        "ALTER TABLE linhas ADD COLUMN IF NOT EXISTS extensao_km NUMERIC(8,2);",
        "ALTER TABLE paradas ADD COLUMN IF NOT EXISTS tipo VARCHAR(50);",
        "ALTER TABLE paradas ADD COLUMN IF NOT EXISTS estrutura VARCHAR(80);",
    ]
    with engine.begin() as conn:
        for sql in comandos:
            conn.execute(text(sql))


def importar_dados():
    engine = criar_engine()
    garantir_colunas_enriquecidas(engine)

    print("Lendo os arquivos oficiais da SEMOB-DF...")
    df_paradas_raw = pd.read_csv(ARQ_PARADAS, sep=",", encoding="utf-8")
    df_horarios_raw = pd.read_csv(ARQ_HORARIOS, sep=",", encoding="utf-8", dtype={"cd_linha": str})
    df_viagens_raw = pd.read_csv(ARQ_VIAGENS, sep=",", encoding="utf-8", dtype={"cd_linha": str})
    df_percursos_raw = pd.read_csv(ARQ_PERCURSOS, sep=",", encoding="utf-8", dtype={"cd_linha": str})

    # Filtra apenas paradas ativas
    total_paradas_bruto = len(df_paradas_raw)
    if "situacao" in df_paradas_raw.columns:
        df_paradas_raw = df_paradas_raw[
            df_paradas_raw["situacao"].astype(str).str.strip().str.upper() == "ATIVA"
        ].copy()
    print(f"-> Paradas ativas: {len(df_paradas_raw)} (descartadas: {total_paradas_bruto - len(df_paradas_raw)})")

    # Filtra apenas percursos ativos
    total_percursos_bruto = len(df_percursos_raw)
    if "situacao" in df_percursos_raw.columns:
        df_percursos = df_percursos_raw[
            df_percursos_raw["situacao"].astype(str).str.strip().str.upper() == "ATIVA"
        ].copy()
    else:
        df_percursos = df_percursos_raw.copy()
    print(f"-> Percursos ativos: {len(df_percursos)} (descartados: {total_percursos_bruto - len(df_percursos)})")

    # Filtra apenas horários vigentes (descarta horários com dt_final_vigencia já vencida)
    hoje = date.today()
    total_horarios_bruto = len(df_horarios_raw)
    if "dt_final_vigencia" in df_horarios_raw.columns:
        mask_vigente = df_horarios_raw["dt_final_vigencia"].apply(lambda v: horario_esta_vigente(v, hoje))
        df_horarios_raw = df_horarios_raw[mask_vigente].copy()
    print(f"-> Horários vigentes: {len(df_horarios_raw)} (vencidos descartados: {total_horarios_bruto - len(df_horarios_raw)})")

    print("Processando Paradas e Geometrias...")
    df_paradas_raw["geometry"] = df_paradas_raw["geo_ponto_rede_pto"].apply(
        lambda x: wkt.loads(str(x).strip('"').strip("'").strip())
    )

    nome_por_parada = {}
    paradas_registros = []
    paradas_vistas = set()
    for _, row in df_paradas_raw.iterrows():
        parada_id = str(row["parada"]).strip()
        if parada_id in paradas_vistas:
            continue
        paradas_vistas.add(parada_id)
        lat, lon = limpar_coordenada_ponto(row["geo_ponto_rede_pto"])
        nome = limpar_texto(row.get("descricao")) or f"Parada {parada_id}"
        tipo = limpar_texto(row.get("tipo"))
        estrutura = limpar_texto(row.get("estrutura_de_paragem"))
        nome_por_parada[parada_id] = nome
        paradas_registros.append((parada_id, parada_id, nome, lat, lon, tipo, estrutura))

    print("Cruzando traçados das linhas com as paradas ativas...")
    paradas_por_linha = {}
    geometrias_paradas = df_paradas_raw["geometry"].tolist()
    codigos_paradas = df_paradas_raw["parada"].astype(str).str.strip().tolist()
    arvore_paradas = STRtree(geometrias_paradas)

    meta_percursos = {}
    for _, row in df_percursos.iterrows():
        cd_linha = str(row["cd_linha"]).strip()
        sentido_geo = str(row["lin_sentido"]).strip().upper()
        sentido = "IDA" if sentido_geo in ["IDA", "I", "C", "CIRCULAR"] else "VOLTA"

        tx_linha = limpar_texto(row.get("tx_linha"))
        tarifa = float(row["vl_tarifa"]) if pd.notna(row.get("vl_tarifa")) else None
        faixa = limpar_texto(row.get("fx_tarifaria"))
        extensao = round(float(row["lin_extensao"]), 2) if pd.notna(row.get("lin_extensao")) else None

        if cd_linha not in meta_percursos:
            meta_percursos[cd_linha] = {
                "nome": tx_linha,
                "tarifa": tarifa,
                "faixa_tarifaria": faixa,
                "extensao_km": extensao,
            }
        else:
            if not meta_percursos[cd_linha]["nome"] and tx_linha:
                meta_percursos[cd_linha]["nome"] = tx_linha
            if meta_percursos[cd_linha]["tarifa"] is None and tarifa is not None:
                meta_percursos[cd_linha]["tarifa"] = tarifa
            if not meta_percursos[cd_linha]["faixa_tarifaria"] and faixa:
                meta_percursos[cd_linha]["faixa_tarifaria"] = faixa
            if meta_percursos[cd_linha]["extensao_km"] is None and extensao is not None:
                meta_percursos[cd_linha]["extensao_km"] = extensao

        wkt_linha = str(row["geo_linhas_lin_31983"]).strip('"').strip("'").strip()
        linha_geom = wkt.loads(wkt_linha)

        buffer_linha = linha_geom.buffer(50)
        indices_candidatos = arvore_paradas.query(buffer_linha, predicate="intersects")

        if len(indices_candidatos) > 0:
            paradas_ordenadas = sorted(
                (
                    (linha_geom.project(geometrias_paradas[idx]), codigos_paradas[idx])
                    for idx in indices_candidatos
                ),
                key=lambda item: item[0],
            )
            chave = f"{cd_linha}_{sentido}"
            paradas_por_linha[chave] = [codigo for _, codigo in paradas_ordenadas]

    print(f"-> Itinerários mapeados: {len(paradas_por_linha)}.")

    # Operadora mais frequente por linha (priorizando horários vigentes e viagens)
    operadora_por_linha = {}
    for df_op in (df_horarios_raw, df_viagens_raw):
        if "nm_operadora" not in df_op.columns:
            continue
        for cd_linha, grupo in df_op.groupby(df_op["cd_linha"].astype(str).str.strip()):
            if cd_linha in operadora_por_linha:
                continue
            valores = grupo["nm_operadora"].dropna().astype(str).str.strip()
            valores = valores[valores != ""]
            if not valores.empty:
                operadora_por_linha[cd_linha] = valores.mode().iloc[0]

    # Nomes oficiais das linhas: viagens -> percursos -> fallback "Linha <codigo>"
    nome_linha_por_id = {}
    for _, row in df_viagens_raw[["cd_linha", "tx_denominacao_linha"]].drop_duplicates(subset=["cd_linha"]).iterrows():
        cd = str(row["cd_linha"]).strip()
        nome = limpar_texto(row.get("tx_denominacao_linha"))
        if cd and nome:
            nome_linha_por_id[cd] = nome

    for cd, meta in meta_percursos.items():
        if cd not in nome_linha_por_id and meta.get("nome"):
            nome_linha_por_id[cd] = meta["nome"]

    todos_codigos = set(nome_linha_por_id.keys())
    todos_codigos.update(df_horarios_raw["cd_linha"].astype(str).str.strip().unique())
    todos_codigos.update(meta_percursos.keys())

    linhas_registros = []
    for cd in sorted(todos_codigos):
        if not cd or cd.lower() == "nan":
            continue
        meta = meta_percursos.get(cd, {})
        nome = nome_linha_por_id.get(cd) or meta.get("nome") or f"Linha {cd}"
        operadora_bruta = operadora_por_linha.get(cd)
        operadora = normalizar_operadora(operadora_bruta)
        cor = definir_cor_bacia(operadora_bruta)
        linhas_registros.append((
            cd,
            cd,
            nome,
            cor,
            meta.get("tarifa"),
            meta.get("faixa_tarifaria"),
            operadora,
            meta.get("extensao_km"),
        ))

    calendarios_registros = [
        ("CAL_UTIL", "DIA_UTIL", "2026-01-01", "2026-12-31"),
        ("CAL_SAB", "SABADO", "2026-01-01", "2026-12-31"),
        ("CAL_DOM", "DOMINGO_FERIADO", "2026-01-01", "2026-12-31"),
    ]

    print("Atualizando Paradas, Linhas e Calendários no banco (preservando favoritos/usuários)...")
    raw_conn = engine.raw_connection()
    try:
        with raw_conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO paradas (id, codigo, nome, latitude, longitude, tipo, estrutura)
                VALUES %s
                ON CONFLICT (id) DO UPDATE SET
                    codigo = EXCLUDED.codigo,
                    nome = EXCLUDED.nome,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    tipo = EXCLUDED.tipo,
                    estrutura = EXCLUDED.estrutura;
                """,
                paradas_registros,
                page_size=1000,
            )

            execute_values(
                cur,
                """
                INSERT INTO linhas (id, codigo, nome, cor, tarifa, faixa_tarifaria, operadora, extensao_km)
                VALUES %s
                ON CONFLICT (id) DO UPDATE SET
                    codigo = EXCLUDED.codigo,
                    nome = EXCLUDED.nome,
                    cor = EXCLUDED.cor,
                    tarifa = EXCLUDED.tarifa,
                    faixa_tarifaria = EXCLUDED.faixa_tarifaria,
                    operadora = EXCLUDED.operadora,
                    extensao_km = EXCLUDED.extensao_km;
                """,
                linhas_registros,
                page_size=1000,
            )

            execute_values(
                cur,
                """
                INSERT INTO calendario (id, tipo_dia, inicio, fim)
                VALUES %s
                ON CONFLICT (id) DO UPDATE SET
                    tipo_dia = EXCLUDED.tipo_dia,
                    inicio = EXCLUDED.inicio,
                    fim = EXCLUDED.fim;
                """,
                calendarios_registros,
            )

            # Limpa apenas viagens e horários para reimportação idempotente
            cur.execute("DELETE FROM horarios_paradas;")
            cur.execute("DELETE FROM viagens;")
        raw_conn.commit()
        print(f"-> {len(paradas_registros)} paradas e {len(linhas_registros)} linhas atualizadas.")

        print("Processando Viagens e Horários vigentes...")
        viagens_lote = []
        horarios_lote = []
        contador_viagem = 1
        viagens_ignoradas = 0
        total_horarios_inseridos = 0

        def descarregar_lotes():
            nonlocal total_horarios_inseridos
            if not viagens_lote:
                return
            with raw_conn.cursor() as cur:
                execute_values(
                    cur,
                    "INSERT INTO viagens (id, linha_id, calendario_id, sentido, destino) VALUES %s",
                    viagens_lote,
                    page_size=1000,
                )
                execute_values(
                    cur,
                    "INSERT INTO horarios_paradas (viagem_id, parada_id, sequencia, partida, chegada) VALUES %s",
                    horarios_lote,
                    page_size=2000,
                )
            raw_conn.commit()
            total_horarios_inseridos += len(horarios_lote)
            viagens_lote.clear()
            horarios_lote.clear()

        for _, row in df_horarios_raw.iterrows():
            linha_id = str(row["cd_linha"]).strip()
            sentido_raw = str(row["sentido"]).strip().upper()
            sentido = "IDA" if sentido_raw in ["I", "IDA", "0", "C", "CIRCULAR"] else "VOLTA"

            chave_busca = f"{linha_id}_{sentido}"
            if chave_busca not in paradas_por_linha:
                viagens_ignoradas += 1
                continue

            paradas_itinerario = paradas_por_linha[chave_busca]
            ultima_parada_id = paradas_itinerario[-1]
            destino_real = nome_por_parada.get(ultima_parada_id) or "Destino Final"

            trip_id = f"TRIP_{contador_viagem}"

            dia_label = str(row.get("dia_label", "")).lower()
            dias_semana = str(row.get("dias_semana", "")).strip().upper()

            if "sab" in dia_label or dias_semana == "NNNNNSN":
                cal_id = "CAL_SAB"
            elif "dom" in dia_label or "feriado" in dia_label or dias_semana == "NNNNNNS":
                cal_id = "CAL_DOM"
            else:
                cal_id = "CAL_UTIL"

            viagens_lote.append((trip_id, linha_id, cal_id, sentido, destino_real))

            hr_str = str(row["hr_prevista"]).strip()
            hr_saida = parse_horario(hr_str)

            tempo_total = int(row["tempo_percurso"]) if pd.notna(row["tempo_percurso"]) else 60
            num_paradas = len(paradas_itinerario)
            tempo_entre_paradas = tempo_total / max((num_paradas - 1), 1)

            for seq, parada_id in enumerate(paradas_itinerario):
                tempo_decorrido = tempo_entre_paradas * seq
                horario_parada = hr_saida + timedelta(minutes=tempo_decorrido)

                if horario_parada.day > hr_saida.day:
                    horario_parada = horario_parada - timedelta(days=1)

                hora_fmt = horario_parada.strftime("%H:%M:%S")
                horarios_lote.append((trip_id, parada_id, seq + 1, hora_fmt, hora_fmt))

            contador_viagem += 1

            if len(viagens_lote) >= 1000:
                descarregar_lotes()

        descarregar_lotes()
        print(f"-> SUCESSO! {contador_viagem - 1} viagens e {total_horarios_inseridos} horários de parada inseridos.")
        print(f"-> Aviso: {viagens_ignoradas} viagens ignoradas por falta de itinerário no arquivo original.")
    except Exception:
        raw_conn.rollback()
        raise
    finally:
        raw_conn.close()


if __name__ == "__main__":
    importar_dados()
