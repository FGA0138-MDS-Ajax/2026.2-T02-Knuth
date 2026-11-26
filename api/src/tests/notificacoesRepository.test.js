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

  describe('listarPorUsuario', () => {
    it('lista as notificações do usuário da mais recente para a mais antiga', async () => {
      const notificacoes = [
        { id: 2, titulo: 'Desvio', lida: false },
        { id: 1, titulo: 'Suspensão', lida: true }
      ];
      pool.query.mockResolvedValue({ rows: notificacoes });

      const resultado = await repository.listarPorUsuario(3);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/FROM notificacoes/);
      expect(sql).toMatch(/ORDER BY criado_em DESC/);
      expect(params).toEqual([3]);
      expect(resultado).toEqual(notificacoes);
    });
  });
});
