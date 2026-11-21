const pool = require('../config/database');
const repository = require('../repositories/trajetosRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// -----testes------
describe('TrajetosRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('buscarParadasPorNome', () => {
    it('busca normalizando acentos e devolve as paradas candidatas', async () => {
      const paradas = [
        { id: '10', nome: 'Asa Sul - Quadra 704' },
        { id: '11', nome: 'TERMINAL ASA SUL LIGACAO ACESSO' },
      ];
      pool.query.mockResolvedValue({ rows: paradas });

      const resultado = await repository.buscarParadasPorNome('Asa Sul');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('translate(nome');
      expect(sql).toContain('WITH matches AS');
      expect(params[0]).toBe('asa sul');
      expect(params[1]).toBe('%asa sul%');
      expect(resultado).toEqual(paradas);
    });

    it('inclui aliases para Rodoviária do Plano Piloto', async () => {
      const paradas = [{ id: '3369', nome: 'PLATAFORMA SUPERIOR DA RODOVIARIA - APOS ROD.PP EIXO L SUL' }];
      pool.query.mockResolvedValue({ rows: paradas });

      const resultado = await repository.buscarParadasPorNome('Rodoviária do Plano Piloto');

      const [, params] = pool.query.mock.calls[0];
      expect(params).toContain('%rod.pp%');
      expect(params).toContain('%rodoviaria%');
      expect(resultado).toEqual(paradas);
    });

    it('retorna lista vazia sem consultar o banco quando o termo é vazio', async () => {
      const resultado = await repository.buscarParadasPorNome('   ');

      expect(resultado).toEqual([]);
      expect(pool.query).not.toHaveBeenCalled();
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
    it('consulta com listas de ids de origem e destino e devolve as rotas', async () => {
      const rotas = [{ viagem_id: 1, linha_codigo: '0.111', duracao: 25, qtd_paradas: 6 }];
      pool.query.mockResolvedValue({ rows: rotas });

      const resultado = await repository.buscarRotasDiretas([10, 11], [20]);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('ANY($1::text[])');
      expect(sql).toContain('ANY($2::text[])');
      expect(sql).toContain('hp2.sequencia > hp1.sequencia');
      expect(sql).toContain('LIMIT 8');
      expect(params).toEqual([['10', '11'], ['20']]);
      expect(resultado).toEqual(rotas);
    });

    it('também aceita ids unitários e os converte em arrays de texto', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.buscarRotasDiretas(10, 20);

      const [, params] = pool.query.mock.calls[0];
      expect(params).toEqual([['10'], ['20']]);
    });

    it('devolve lista vazia sem consultar o banco quando algum lado é vazio', async () => {
      const resultado = await repository.buscarRotasDiretas([], [20]);

      expect(resultado).toEqual([]);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.buscarRotasDiretas(10, 20)).rejects.toThrow('falha no banco');
    });
  });

  describe('buscarRotasComBaldeacao', () => {
    it('consulta com os ids de origem e destino usando padrões materializados e devolve as rotas', async () => {
      const rotas = [{ linha_1: '0.111', linha_2: '0.222', nome_transferencia: 'Rodoviária' }];
      pool.query.mockResolvedValue({ rows: rotas });

      const resultado = await repository.buscarRotasComBaldeacao([10], [20, 21]);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('padroes_origem AS MATERIALIZED');
      expect(sql).toContain('padroes_destino AS MATERIALIZED');
      expect(sql).toContain('l1.linha_1_id <> l2.linha_2_id');
      expect(sql).toContain('LIMIT 5');
      expect(params).toEqual([['10'], ['20', '21']]);
      expect(resultado).toEqual(rotas);
    });

    it('devolve lista vazia sem consultar o banco quando origem ou destino é vazio', async () => {
      const resultado = await repository.buscarRotasComBaldeacao([10], []);

      expect(resultado).toEqual([]);
      expect(pool.query).not.toHaveBeenCalled();
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
