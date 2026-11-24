jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

const pool = require('../config/database');
const {
  COMANDOS_COLUNAS_ENRIQUECIDAS,
  garantirColunasEnriquecidas,
} = require('../config/garantirSchema');

describe('garantirSchema', () => {
  let erroSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  it('executa todos os ALTER TABLE idempotentes de linhas e paradas e retorna true', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const resultado = await garantirColunasEnriquecidas();

    expect(resultado).toBe(true);
    expect(pool.query).toHaveBeenCalledTimes(COMANDOS_COLUNAS_ENRIQUECIDAS.length);
    COMANDOS_COLUNAS_ENRIQUECIDAS.forEach((sql, indice) => {
      expect(pool.query).toHaveBeenNthCalledWith(indice + 1, sql);
    });
  });

  it('registra aviso e retorna false sem lançar exceção quando o banco falha', async () => {
    pool.query.mockRejectedValueOnce(new Error('conexão indisponível'));

    const resultado = await garantirColunasEnriquecidas();

    expect(resultado).toBe(false);
    expect(erroSpy).toHaveBeenCalledWith(
      'Aviso ao garantir colunas enriquecidas no banco:',
      'conexão indisponível'
    );
  });
});
