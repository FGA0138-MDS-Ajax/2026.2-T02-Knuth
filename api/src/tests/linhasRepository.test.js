const pool = require('../config/database');
const repository = require('../repositories/linhasRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// -----testes------
describe('LinhasRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('findLinhas', () => {
    it('lista todas as linhas quando não há filtro', async () => {
      const linhas = [{ id: 1, codigo: '0.111' }];
      pool.query.mockResolvedValue({ rows: linhas });

      const resultado = await repository.findLinhas();

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM linhas WHERE 1=1');
      expect(sql).not.toContain('ILIKE');
      expect(params).toEqual([]);
      expect(resultado).toEqual(linhas);
    });

    it('busca por código ou nome quando o filtro é um texto', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.findLinhas('asa');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('codigo ILIKE $1 OR nome ILIKE $1');
      expect(params).toEqual(['%asa%']);
    });

    it('busca por código ou nome quando o filtro é um objeto com busca', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.findLinhas({ busca: 'asa' });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('codigo ILIKE $1 OR nome ILIKE $1');
      expect(params).toEqual(['%asa%']);
    });

    it('não filtra quando a busca é um texto vazio', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.findLinhas('');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).not.toContain('ILIKE');
      expect(params).toEqual([]);
    });

    it('não aplica filtros diferentes de busca', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.findLinhas({ bacia: 'Paranoá', regiao: 'Norte', tipo: 'CONVENCIONAL' });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).not.toContain('ILIKE');
      expect(params).toEqual([]);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.findLinhas('asa')).rejects.toThrow('falha no banco');
    });
  });

  describe('findItinerarioByLinhaId', () => {
    it('consulta o itinerário pelo id da linha e devolve todas as linhas', async () => {
      const paradas = [{ sentido: 'IDA', sequencia: 1 }, { sentido: 'IDA', sequencia: 2 }];
      pool.query.mockResolvedValue({ rows: paradas });

      const resultado = await repository.findItinerarioByLinhaId(5);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('SELECT DISTINCT ON (v.sentido, hp.sequencia)');
      expect(sql).toContain('WHERE l.id = $1');
      expect(sql).toContain('ORDER BY v.sentido, hp.sequencia ASC');
      expect(params).toEqual([5]);
      expect(resultado).toEqual(paradas);
    });

    it('devolve lista vazia quando a linha não tem itinerário', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.findItinerarioByLinhaId(99);

      expect(resultado).toEqual([]);
    });
  });

  describe('findHorariosByLinhaId', () => {
    it('consulta os horários de partida da primeira parada da linha', async () => {
      const horarios = [{ sentido: 'IDA', tipo_dia: 'DIA_UTIL', horario_partida: '05:30' }];
      pool.query.mockResolvedValue({ rows: horarios });

      const resultado = await repository.findHorariosByLinhaId(5);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE l.id = $1 AND hp.sequencia = 1');
      expect(sql).toContain("TO_CHAR(hp.partida::time, 'HH24:MI') AS horario_partida");
      expect(sql).toContain('ORDER BY v.sentido, c.tipo_dia, hp.partida ASC');
      expect(params).toEqual([5]);
      expect(resultado).toEqual(horarios);
    });

    it('devolve lista vazia quando a linha não tem horários', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.findHorariosByLinhaId(99);

      expect(resultado).toEqual([]);
    });
  });

  describe('buscarPorId (RF23)', () => {
    it('busca a linha pelo id e devolve o registro', async () => {
      const linha = { id: '0.110', codigo: '0.110', nome: 'Asa Sul' };
      pool.query.mockResolvedValue({ rows: [linha] });

      const resultado = await repository.buscarPorId('0.110');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM linhas WHERE id = $1');
      expect(params).toEqual(['0.110']);
      expect(resultado).toEqual(linha);
    });

    it('devolve null quando a linha não existe', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(repository.buscarPorId('999')).resolves.toBeNull();
    });
  });

  describe('criar (RF23)', () => {
    it('insere a linha usando o código também como id', async () => {
      const criada = { id: '0.110', codigo: '0.110', nome: 'Asa Sul' };
      pool.query.mockResolvedValue({ rows: [criada] });

      const resultado = await repository.criar({
        codigo: '0.110',
        nome: 'Asa Sul',
        cor: '#006666',
        tarifa: 5.5,
        faixaTarifaria: 'METROPOLITANA 1',
        operadora: 'Urbi',
        extensaoKm: 12.5,
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO linhas (id, codigo, nome, cor, tarifa, faixa_tarifaria, operadora, extensao_km)');
      expect(sql).toContain('VALUES ($1, $1, $2, $3, $4, $5, $6, $7)');
      expect(params).toEqual(['0.110', 'Asa Sul', '#006666', 5.5, 'METROPOLITANA 1', 'Urbi', 12.5]);
      expect(resultado).toEqual(criada);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.criar({ codigo: '0.110', nome: 'Asa Sul' })).rejects.toThrow('falha no banco');
    });
  });

  describe('atualizar (RF23)', () => {
    it('atualiza os dados da linha pelo id sem mudar o código', async () => {
      const atualizada = { id: '0.110', codigo: '0.110', nome: 'Asa Norte' };
      pool.query.mockResolvedValue({ rows: [atualizada] });

      const resultado = await repository.atualizar('0.110', {
        nome: 'Asa Norte',
        cor: null,
        tarifa: null,
        faixaTarifaria: null,
        operadora: null,
        extensaoKm: null,
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('UPDATE linhas');
      expect(sql).toContain('SET nome = $2, cor = $3, tarifa = $4, faixa_tarifaria = $5, operadora = $6, extensao_km = $7');
      expect(sql).toContain('WHERE id = $1');
      expect(sql).not.toContain('codigo =');
      expect(params).toEqual(['0.110', 'Asa Norte', null, null, null, null, null]);
      expect(resultado).toEqual(atualizada);
    });
  });

  describe('excluir (RF23)', () => {
    it('exclui a linha pelo id', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      await repository.excluir('0.110');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toBe('DELETE FROM linhas WHERE id = $1');
      expect(params).toEqual(['0.110']);
    });
  });
});
