CREATE TABLE IF NOT EXISTS calendario (
    id VARCHAR(50) PRIMARY KEY,
    tipo_dia VARCHAR(20) CHECK (tipo_dia IN ('DIA_UTIL', 'SABADO', 'DOMINGO_FERIADO')),
    inicio DATE,
    fim DATE
);

CREATE TABLE IF NOT EXISTS linhas (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cor VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS paradas (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8)
);

CREATE TABLE IF NOT EXISTS viagens (
    id VARCHAR(50) PRIMARY KEY,
    linha_id VARCHAR(50) REFERENCES linhas(id) ON DELETE CASCADE,
    calendario_id VARCHAR(50) REFERENCES calendario(id) ON DELETE CASCADE,
    sentido VARCHAR(50) CHECK (sentido IN ('IDA', 'VOLTA')),
    destino VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS horarios_paradas (
    id SERIAL PRIMARY KEY,
    viagem_id VARCHAR(50) REFERENCES viagens(id) ON DELETE CASCADE,
    parada_id VARCHAR(50) REFERENCES paradas(id) ON DELETE CASCADE,
    sequencia INTEGER NOT NULL,
    partida TIME,
    chegada TIME
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'PASSAGEIRO',
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buscas_recentes (
    id SERIAL PRIMARY KEY,
    origem VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    realizada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertas (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('DESVIO', 'SUSPENSAO', 'ALTERACAO_HORARIO', 'PARALISACAO')),
    titulo VARCHAR(255),
    descricao TEXT NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    encerrado_em TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertas_linhas (
    alerta_id INTEGER REFERENCES alertas(id) ON DELETE CASCADE,
    linha_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (alerta_id, linha_id)
);

CREATE TABLE IF NOT EXISTS alertas_paradas (
    alerta_id INTEGER REFERENCES alertas(id) ON DELETE CASCADE,
    parada_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (alerta_id, parada_id)
);

CREATE TABLE IF NOT EXISTS reportes_divergencia (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('HORARIO', 'PARADA', 'ITINERARIO')),
    descricao TEXT NOT NULL,
    linha_id VARCHAR(50),
    parada_id VARCHAR(50),
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PROCEDENTE', 'IMPROCEDENTE')),
    observacao_admin TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analisado_em TIMESTAMP WITH TIME ZONE
);

INSERT INTO usuarios (nome, email, senha_hash, tipo)
VALUES ('Administrador', 'admin@rotasdf.com', '$2b$10$YIRTlYFXqX9MpSOHqjSjceSTXG500o8cWkapw3nG5til7lxW38HWC', 'ADMIN')
ON CONFLICT (email) DO NOTHING;
