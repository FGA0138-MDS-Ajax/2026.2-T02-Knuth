const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ quiet: true });

const NOME_BANCO = process.env.DB_NAME_SISTEMA || 'rotasdf_teste';
const CAMINHO_SCHEMA = path.resolve(__dirname, '../../../../infrastructure/init.sql');

const SEMENTES = `
TRUNCATE horarios_paradas, viagens, calendario, paradas, linhas, usuarios,
  buscas_recentes, recuperacoes_senha, reportes_divergencia, favoritos, alertas
  RESTART IDENTITY CASCADE;

INSERT INTO calendario (id, tipo_dia, inicio, fim) VALUES
  ('9301', 'DIA_UTIL', '2026-01-01', '2026-12-31'),
  ('9302', 'SABADO', '2026-01-01', '2026-12-31'),
  ('9303', 'DOMINGO_FERIADO', '2026-01-01', '2026-12-31');

INSERT INTO linhas (id, codigo, nome, cor) VALUES
  ('9001', '0.9001', 'Sistema Alfa', '#FF0000'),
  ('9002', '0.9002', 'Sistema Beta', '#00FF00'),
  ('9003', '0.9003', 'Sistema Gama', '#0000FF');

INSERT INTO paradas (id, codigo, nome, latitude, longitude) VALUES
  ('9101', 'PS9101', 'Parada Sistema Alfa', -15.794200, -47.882500),
  ('9102', 'PS9102', 'Parada Sistema Beta', -15.814200, -47.922500),
  ('9103', 'PS9103', 'Parada Sistema Gama', -15.834200, -47.962500),
  ('9104', 'PS9104', 'Parada Sistema Delta', -15.854200, -48.002500),
  ('9105', 'PS9105', 'Parada Sistema Epsilon', -15.874200, -48.042500),
  ('9106', 'PS9106', 'Estação Júlia Sistema', -15.500000, -47.500000);

INSERT INTO viagens (id, linha_id, calendario_id, sentido, destino) VALUES
  ('V9001-IDA-1', '9001', '9301', 'IDA', 'Parada Sistema Gama'),
  ('V9001-IDA-2', '9001', '9301', 'IDA', 'Parada Sistema Gama'),
  ('V9001-IDA-3', '9001', '9302', 'IDA', 'Parada Sistema Gama'),
  ('V9001-VOLTA-1', '9001', '9301', 'VOLTA', 'Parada Sistema Alfa'),
  ('V9002-IDA-1', '9002', '9301', 'IDA', 'Parada Sistema Epsilon');

INSERT INTO horarios_paradas (viagem_id, parada_id, sequencia, partida, chegada) VALUES
  ('V9001-IDA-1', '9101', 1, '08:00', '08:00'),
  ('V9001-IDA-1', '9102', 2, '08:10', '08:10'),
  ('V9001-IDA-1', '9103', 3, '08:20', '08:20'),
  ('V9001-IDA-2', '9101', 1, '09:00', '09:00'),
  ('V9001-IDA-2', '9102', 2, '09:10', '09:10'),
  ('V9001-IDA-2', '9103', 3, '09:20', '09:20'),
  ('V9001-IDA-3', '9101', 1, '10:00', '10:00'),
  ('V9001-IDA-3', '9102', 2, '10:10', '10:10'),
  ('V9001-IDA-3', '9103', 3, '10:20', '10:20'),
  ('V9001-VOLTA-1', '9103', 1, '18:00', '18:00'),
  ('V9001-VOLTA-1', '9102', 2, '18:10', '18:10'),
  ('V9001-VOLTA-1', '9101', 3, '18:20', '18:20'),
  ('V9002-IDA-1', '9103', 1, '08:30', '08:30'),
  ('V9002-IDA-1', '9104', 2, '08:40', '08:40'),
  ('V9002-IDA-1', '9105', 3, '08:50', '08:50');
`;

function opcoes(database) {
  return {
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || '127.0.0.1',
    database,
    password: process.env.DB_PASSWORD || 'adminpassword',
    port: Number(process.env.DB_PORT || 5432),
  };
}

function validarNomeDoBanco() {
  if (!/^[A-Za-z0-9_]+$/.test(NOME_BANCO) || !/test/i.test(NOME_BANCO)) {
    throw new Error(
      `O banco do teste de sistema precisa ter "test" no nome para evitar apagar dados reais (recebido: ${NOME_BANCO}).`
    );
  }
}

async function garantirBanco() {
  const cliente = new Client(opcoes('postgres'));
  await cliente.connect();
  try {
    const { rowCount } = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [NOME_BANCO]);
    if (rowCount === 0) {
      await cliente.query(`CREATE DATABASE "${NOME_BANCO}"`);
    }
  } finally {
    await cliente.end();
  }
}

async function prepararEsquemaEDados() {
  const cliente = new Client(opcoes(NOME_BANCO));
  await cliente.connect();
  try {
    await cliente.query(fs.readFileSync(CAMINHO_SCHEMA, 'utf8'));
    await cliente.query(SEMENTES);
  } finally {
    await cliente.end();
  }
}

module.exports = async () => {
  validarNomeDoBanco();
  await garantirBanco();
  await prepararEsquemaEDados();
};
