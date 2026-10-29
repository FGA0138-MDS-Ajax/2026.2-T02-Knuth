CREATE TABLE IF NOT EXISTS calendario(
    id VARCHAR(50) PRIMARY KEY,
    tipo_dia VARCHAR(20) CHECK (tipo_dia IN ('DIA_UTIL', 'SABADO', 'DOMINGO_FERIADO')),
    inicio DATE,
    fim DATE
);

CREATE TABLE IF NOT EXISTS linhas(
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cor VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS paradas(
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8)
);

CREATE TABLE IF NOT EXISTS viagens(
    id VARCHAR(50) PRIMARY KEY,
    linha_id VARCHAR(50) REFERENCES linhas(id) ON DELETE CASCADE,
    calendario_id VARCHAR(50) REFERENCES calendario(id) ON DELETE CASCADE,
    sentido VARCHAR(50) CHECK (sentido IN ('IDA', 'VOLTA')),
    destino VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS horarios_paradas(
    id SERIAL PRIMARY KEY,
    viagem_id VARCHAR(50) REFERENCES viagens(id) ON DELETE CASCADE,
    parada_id VARCHAR(50) REFERENCES paradas(id) ON DELETE CASCADE,
    sequencia INTEGER NOT NULL,
    partida TIME,
    chegada TIME
);