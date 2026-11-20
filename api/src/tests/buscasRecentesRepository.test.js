const pool = require('../config/database');
const repository = require('../repositories/buscasRecentesRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// -----testes------
describe('BuscasRecentesRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('salvarBusca', () => {
    it('insere a busca e devolve a primeira linha retornada', async () => {
      const linha = { id: 1, origem: 'Asa Sul', destino: 'Rodoviária', usuario_id: 3 };
      pool.query.mockResolvedValue({ rows: [linha] });

      const resultado = await repository.salvarBusca('Asa Sul', 'Rodoviária', 3);

      const [sql, valores] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO buscas_recentes (origem, destino, usuario_id, realizada_em)');
      expect(sql).toContain('RETURNING');
      expect(valores).toEqual(['Asa Sul', 'Rodoviária', 3]);
      expect(resultado).toEqual(linha);
    });

    it('usa null como usuário quando ele não é informado', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 2 }] });

      await repository.salvarBusca('Asa Sul', 'Rodoviária');

      expect(pool.query.mock.calls[0][1]).toEqual(['Asa Sul', 'Rodoviária', null]);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.salvarBusca('A', 'B')).rejects.toThrow('falha no banco');
    });
  });

  describe('listarBuscasRecentes', () => {
    it('consulta com o usuário e o limite informados e devolve todas as linhas', async () => {
      const linhas = [{ id: 1 }, { id: 2 }];
      pool.query.mockResolvedValue({ rows: linhas });

      const resultado = await repository.listarBuscasRecentes(3, 10);

      const [sql, valores] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM buscas_recentes');
      expect(sql).toContain('ORDER BY realizada_em DESC');
      expect(sql).toContain('LIMIT $2');
      expect(valores).toEqual([3, 10]);
      expect(resultado).toEqual(linhas);
    });

    it('usa usuário null e limite 5 por padrão', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.listarBuscasRecentes();

      expect(pool.query.mock.calls[0][1]).toEqual([null, 5]);
    });

    it('devolve lista vazia quando não há buscas', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.listarBuscasRecentes(3);

      expect(resultado).toEqual([]);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.listarBuscasRecentes(3)).rejects.toThrow('falha no banco');
    });
  });
});
