const pool = require('../config/database');
const repository = require('../repositories/notificacoesRepository');

jest.mock('../config/database', () => ({ query: jest.fn() }));

describe('notificacoesRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarParaFavoritosAfetados', () => {
    it('insere uma notificação por favorito afetado e devolve os destinatários', async () => {
      const destinatarios = [
        { usuario_id: 3, item_tipo: 'LINHA', item_id: '0.111', nome: 'Ana', email: 'ana@exemplo.com' }
      ];
      pool.query.mockResolvedValue({ rows: destinatarios });

      const resultado = await repository.criarParaFavoritosAfetados({
        alertaId: 7,
        titulo: 'Desvio',
        resumo: 'Desvio na linha 0.111',
        linhas: ['0.111'],
        paradas: ['P1']
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/INSERT INTO notificacoes/);
      expect(sql).toMatch(/ON CONFLICT/);
      expect(params).toEqual([7, 'Desvio', 'Desvio na linha 0.111', ['0.111'], ['P1']]);
      expect(resultado).toEqual(destinatarios);
    });

    it('não consulta o banco quando não há linhas nem paradas afetadas', async () => {
      const resultado = await repository.criarParaFavoritosAfetados({
        alertaId: 7,
        titulo: 'Desvio',
        resumo: 'Sem itens',
        linhas: [],
        paradas: []
      });

      expect(pool.query).not.toHaveBeenCalled();
      expect(resultado).toEqual([]);
    });
  });
});
