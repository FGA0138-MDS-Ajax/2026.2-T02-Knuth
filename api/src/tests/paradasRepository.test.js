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

    it('traz também tipo e estrutura, usados na edição da parada (RF23)', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.findById('3369');

      const [sql] = pool.query.mock.calls[0];
      expect(sql).toContain('SELECT id, codigo, nome, latitude, longitude, tipo, estrutura');
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

  describe('criar (RF23)', () => {
    it('insere a parada usando o código também como id', async () => {
      const criada = { id: '3369', codigo: '3369', nome: 'Rodoviária' };
      pool.query.mockResolvedValue({ rows: [criada] });

      const resultado = await repository.criar({
        codigo: '3369',
        nome: 'Rodoviária',
        latitude: -15.79,
        longitude: -47.88,
        tipo: 'Placa',
        estrutura: null,
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO paradas (id, codigo, nome, latitude, longitude, tipo, estrutura)');
      expect(sql).toContain('VALUES ($1, $1, $2, $3, $4, $5, $6)');
      expect(params).toEqual(['3369', 'Rodoviária', -15.79, -47.88, 'Placa', null]);
      expect(resultado).toEqual(criada);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.criar({ codigo: '3369', nome: 'Rodoviária' })).rejects.toThrow('falha no banco');
    });
  });

  describe('atualizar (RF23)', () => {
    it('atualiza os dados da parada pelo id sem mudar o código', async () => {
      const atualizada = { id: '3369', codigo: '3369', nome: 'Rodoviária do Plano Piloto' };
      pool.query.mockResolvedValue({ rows: [atualizada] });

      const resultado = await repository.atualizar('3369', {
        nome: 'Rodoviária do Plano Piloto',
        latitude: -15.79,
        longitude: -47.88,
        tipo: null,
        estrutura: null,
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('UPDATE paradas');
      expect(sql).toContain('SET nome = $2, latitude = $3, longitude = $4, tipo = $5, estrutura = $6');
      expect(sql).toContain('WHERE id = $1');
      expect(sql).not.toContain('codigo =');
      expect(params).toEqual(['3369', 'Rodoviária do Plano Piloto', -15.79, -47.88, null, null]);
      expect(resultado).toEqual(atualizada);
    });
  });

  describe('contarLinhasNoItinerario (RF23)', () => {
    it('conta as linhas distintas cujas viagens passam pela parada', async () => {
      pool.query.mockResolvedValue({ rows: [{ total: '3' }] });

      const resultado = await repository.contarLinhasNoItinerario('3369');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('COUNT(DISTINCT v.linha_id)');
      expect(sql).toContain('INNER JOIN viagens v ON v.id = hp.viagem_id');
      expect(sql).toContain('WHERE hp.parada_id = $1');
      expect(params).toEqual(['3369']);
      expect(resultado).toBe(3);
    });

    it('devolve zero quando a parada não está em nenhum itinerário', async () => {
      pool.query.mockResolvedValue({ rows: [{ total: '0' }] });

      await expect(repository.contarLinhasNoItinerario('3369')).resolves.toBe(0);
    });
  });

  describe('excluir (RF23)', () => {
    it('exclui a parada pelo id', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      await repository.excluir('3369');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toBe('DELETE FROM paradas WHERE id = $1');
      expect(params).toEqual(['3369']);
    });
  });
});
