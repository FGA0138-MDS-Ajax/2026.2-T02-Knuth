const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../app');
const pool = require('../../config/database');

let contador = 0;

const api = () => request(app);

function cabecalho(token) {
  return { Authorization: `Bearer ${token}` };
}

function emailUnico(prefixo) {
  contador += 1;
  return `${prefixo}.${Date.now()}.${contador}@sistema.teste`;
}

function isoEmHoras(horas) {
  return new Date(Date.now() + horas * 3600 * 1000).toISOString();
}

async function cadastrarPassageiro(sobrescrever = {}) {
  const dados = {
    nome: 'Passageiro Teste',
    email: emailUnico('passageiro'),
    senha: 'senha123',
    ...sobrescrever,
  };
  const resposta = await api().post('/api/v1/usuarios/cadastro').send(dados);
  return { dados, resposta, usuario: resposta.body };
}

function logar(email, senha) {
  return api().post('/api/v1/usuarios/login').send({ email, senha });
}

async function criarPassageiroLogado(sobrescrever = {}) {
  const { dados, usuario } = await cadastrarPassageiro(sobrescrever);
  const login = await logar(dados.email, dados.senha);
  return { dados, usuario, token: login.body.token };
}

async function criarAdminLogado(sobrescrever = {}) {
  const dados = {
    nome: 'Admin Teste',
    email: emailUnico('admin'),
    senha: 'admin123',
    ...sobrescrever,
  };
  const hash = await bcrypt.hash(dados.senha, 10);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, tipo)
     VALUES ($1, $2, $3, 'ADMIN')
     RETURNING id, nome, email, tipo`,
    [dados.nome, dados.email, hash]
  );
  const login = await logar(dados.email, dados.senha);
  return { dados, usuario: rows[0], token: login.body.token };
}

async function resetarDados() {
  await pool.query(
    `TRUNCATE usuarios, buscas_recentes, recuperacoes_senha, reportes_divergencia,
       favoritos, alertas RESTART IDENTITY CASCADE`
  );
}

async function encerrarConexoes() {
  await pool.end();
}

module.exports = {
  api,
  pool,
  cabecalho,
  emailUnico,
  isoEmHoras,
  cadastrarPassageiro,
  logar,
  criarPassageiroLogado,
  criarAdminLogado,
  resetarDados,
  encerrarConexoes,
};
