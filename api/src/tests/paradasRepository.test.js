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

  describe('buscarPorNome', () => {
    it('busca paradas ignorando acentos e respeitando o limite', async () => {
      const paradas = [{ id: '3369', nome: 'PLATAFORMA SUPERIOR DA RODOVIARIA' }];
      pool.query.mockResolvedValue({ rows: paradas });

      const resultado = await repository.buscarPorNome('Rodoviária', 5);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('translate(nome');
      expect(params[0]).toBe('rodoviaria');
      expect(params[params.length - 1]).toBe(5);
      expect(resultado).toEqual(paradas);
    });

    it('retorna lista vazia sem consultar o banco quando o termo é vazio', async () => {
      const resultado = await repository.buscarPorNome('   ');

      expect(resultado).toEqual([]);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('busca parada pelo identificador e retorna o registro encontrado', async () => {
      const parada = { id: '3369', codigo: 'P-101', nome: 'Rodoviária', latitude: '-15.79', longitude: '-47.88' };
      pool.query.mockResolvedValue({ rows: [parada] });

      const resultado = await repository.findById('3369');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM paradas');
      expect(sql).toContain('WHERE id = $1');
      expect(params).toEqual(['3369']);
      expect(resultado).toEqual(parada);
    });

    it('retorna null quando a parada não existe', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(repository.findById('inexistente')).resolves.toBeNull();
    });
  });

  describe('findProximasPartidas', () => {
    it('consulta partidas filtrando parada, tipo de dia e horário em ordem cronológica', async () => {
      const partidas = [
        {
          linha_id: 'L1',
          linha_codigo: '0.111',
          linha_nome: 'Rodoviária / Asa Sul',
          linha_cor: '#006666',
          sentido: 'IDA',
          destino: 'Asa Sul',
          horario_partida: '14:20',
        },
      ];
      pool.query.mockResolvedValue({ rows: partidas });

      const resultado = await repository.findProximasPartidas('3369', 'DIA_UTIL', '14:10', 20);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM horarios_paradas hp');
      expect(sql).toContain('hp.parada_id = $1');
      expect(sql).toContain('c.tipo_dia = $2');
      expect(sql).toContain('hp.partida::time >= $3::time');
      expect(sql).toContain('ORDER BY horario_partida ASC');
      expect(params).toEqual(['3369', 'DIA_UTIL', '14:10', 20]);
      expect(resultado).toEqual(partidas);
    });
  });
});
