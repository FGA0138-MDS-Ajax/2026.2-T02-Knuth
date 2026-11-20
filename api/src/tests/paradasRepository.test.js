const pool = require('../config/database');
const repository = require('../repositories/paradasRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// -----testes------
describe('ParadasRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('findNearestParada', () => {
    it('consulta com latitude e longitude e devolve a parada mais próxima', async () => {
      const parada = { id: 10, nome: 'Asa Sul - Quadra 704', distancia: 0.2 };
      pool.query.mockResolvedValue({ rows: [parada] });

      const resultado = await repository.findNearestParada('-15.79', '-47.88');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM paradas');
      expect(sql).toContain('ORDER BY distancia ASC');
      expect(sql).toContain('LIMIT 1');
      expect(params).toEqual(['-15.79', '-47.88']);
      expect(resultado).toEqual(parada);
    });

    it('devolve null quando não há paradas cadastradas', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.findNearestParada('-15.79', '-47.88');

      expect(resultado).toBeNull();
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.findNearestParada('-15.79', '-47.88')).rejects.toThrow(
        'falha no banco'
      );
    });
  });
});
