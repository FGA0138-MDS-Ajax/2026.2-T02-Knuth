const pool = require('../src/config/database');
const repository = require('../src/repositories/trajetosRepository');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

// -----testes------
describe('TrajetosRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('buscarParadasPorNome', () => {
    it('busca por parte do nome, sem diferenciar maiúsculas, e devolve as linhas', async () => {
      const paradas = [{ id: 10, nome: 'Asa Sul - Quadra 704' }];
      pool.query.mockResolvedValue({ rows: paradas });

      const resultado = await repository.buscarParadasPorNome('asa sul');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE nome ILIKE $1 LIMIT 1');
      expect(params).toEqual(['%asa sul%']);
      expect(resultado).toEqual(paradas);
    });

    it('devolve lista vazia quando nenhuma parada corresponde', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.buscarParadasPorNome('inexistente');

      expect(resultado).toEqual([]);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.buscarParadasPorNome('asa')).rejects.toThrow('falha no banco');
    });
  });

  describe('buscarRotasDiretas', () => {
    it('consulta com os ids de origem e destino e devolve as rotas', async () => {
      const rotas = [{ viagem_id: 1, linha_codigo: '0.111', duracao: 25, qtd_paradas: 6 }];
      pool.query.mockResolvedValue({ rows: rotas });

      const resultado = await repository.buscarRotasDiretas(10, 20);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE hp2.sequencia > hp1.sequencia');
      expect(sql).toContain('ORDER BY hp1.partida ASC');
      expect(sql).toContain('LIMIT 5');
      expect(params).toEqual([10, 20]);
      expect(resultado).toEqual(rotas);
    });

    it('devolve lista vazia quando não há rota direta', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.buscarRotasDiretas(10, 20);

      expect(resultado).toEqual([]);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.buscarRotasDiretas(10, 20)).rejects.toThrow('falha no banco');
    });
  });

  describe('buscarRotasComBaldeacao', () => {
    it('consulta com os ids de origem e destino e devolve as rotas', async () => {
      const rotas = [{ linha_1: '0.111', linha_2: '0.222', nome_transferencia: 'Rodoviária' }];
      pool.query.mockResolvedValue({ rows: rotas });

      const resultado = await repository.buscarRotasComBaldeacao(10, 20);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WITH leg1 AS');
      expect(sql).toContain('leg2 AS');
      expect(sql).toContain('WHERE leg1.linha_1 != leg2.linha_2');
      expect(sql).toContain('ORDER BY leg1.hora_origem ASC');
      expect(sql).toContain('LIMIT 5');
      expect(params).toEqual([10, 20]);
      expect(resultado).toEqual(rotas);
    });

    it('devolve lista vazia quando não há rota com baldeação', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.buscarRotasComBaldeacao(10, 20);

      expect(resultado).toEqual([]);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.buscarRotasComBaldeacao(10, 20)).rejects.toThrow('falha no banco');
    });
  });
});
