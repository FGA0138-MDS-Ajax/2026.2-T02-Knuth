const path = require('path');

jest.mock('pg', () => ({ Pool: jest.fn() }));
jest.mock('dotenv', () => ({ config: jest.fn() }));

const VARIAVEIS = [
  'DATABASE_URL',
  'DB_USER',
  'DB_HOST',
  'DB_NAME',
  'DB_PASSWORD',
  'DB_PORT',
];

function carregar() {
  let resultado;

  jest.isolateModules(() => {
    const { Pool } = require('pg');
    const dotenv = require('dotenv');
    const pool = require('../config/database');

    resultado = { Pool, dotenv, pool };
  });

  return resultado;
}

// -----testes------
describe('database', () => {
  const originais = {};

  beforeAll(() => {
    VARIAVEIS.forEach((nome) => {
      originais[nome] = process.env[nome];
    });
  });

  beforeEach(() => {
    VARIAVEIS.forEach((nome) => {
      delete process.env[nome];
    });
  });

  afterAll(() => {
    VARIAVEIS.forEach((nome) => {
      if (originais[nome] === undefined) {
        delete process.env[nome];
      } else {
        process.env[nome] = originais[nome];
      }
    });
  });

  it('carrega as variáveis do arquivo .env da raiz e do módulo api', () => {
    const { dotenv } = carregar();

    expect(dotenv.config).toHaveBeenCalledTimes(2);

    expect(dotenv.config).toHaveBeenNthCalledWith(1, {
      path: path.resolve(__dirname, '../../../.env'),
    });

    expect(dotenv.config).toHaveBeenNthCalledWith(2);
  });

  it('cria um único pool e o exporta', () => {
    const { Pool, pool } = carregar();

    expect(Pool).toHaveBeenCalledTimes(1);
    expect(pool).toBe(Pool.mock.instances[0]);
  });

  it('usa DATABASE_URL com SSL quando configurada', () => {
    process.env.DATABASE_URL =
      'postgresql://user:pass@neon.tech/rotasdf';

    const { Pool } = carregar();

    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgresql://user:pass@neon.tech/rotasdf',
      ssl: { rejectUnauthorized: false },
    });
  });

  it('usa os valores padrão quando as variáveis de ambiente não existem', () => {
    const { Pool } = carregar();

    expect(Pool).toHaveBeenCalledWith({
      user: undefined,
      host: '127.0.0.1',
      database: 'rotasdf',
      password: undefined,
      port: 5432,
    });
  });

  it('usa as variáveis de ambiente quando elas existem', () => {
    process.env.DB_USER = 'usuario_ci';
    process.env.DB_HOST = 'banco.exemplo.com';
    process.env.DB_NAME = 'rotasdf_teste';
    process.env.DB_PASSWORD = 'senha_ci';
    process.env.DB_PORT = '5433';

    const { Pool } = carregar();

    expect(Pool).toHaveBeenCalledWith({
      user: 'usuario_ci',
      host: 'banco.exemplo.com',
      database: 'rotasdf_teste',
      password: 'senha_ci',
      port: 5433,
    });
  });

  it('mistura variáveis definidas com valores padrão', () => {
    process.env.DB_HOST = 'banco.exemplo.com';
    process.env.DB_NAME = 'rotasdf_teste';

    const { Pool } = carregar();

    expect(Pool).toHaveBeenCalledWith({
      user: undefined,
      host: 'banco.exemplo.com',
      database: 'rotasdf_teste',
      password: undefined,
      port: 5432,
    });
  });
});