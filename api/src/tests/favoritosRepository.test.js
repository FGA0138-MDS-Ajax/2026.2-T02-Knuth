const pool = require('../config/database');
const repository = require('../repositories/favoritosRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

describe('FavoritosRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listar', () => {
    it('lista apenas os favoritos do usuário, do mais recente ao mais antigo', async () => {
      const linhas = [{ id: 1, tipo: 'LINHA', linhaId: '0.111-1' }];
      pool.query.mockResolvedValue({ rows: linhas });

      const resultado = await repository.listar(3);

      const [sql, valores] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM favoritos');
      expect(sql).toContain('WHERE f.usuario_id = $1');
      expect(sql).toContain('ORDER BY f.criado_em DESC');
      expect(valores).toEqual([3]);
      expect(resultado).toEqual(linhas);
    });

    it('devolve lista vazia quando o usuário não tem favoritos', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      expect(await repository.listar(3)).toEqual([]);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.listar(3)).rejects.toThrow('falha no banco');
    });
  });

  describe('adicionar', () => {
    it('insere o favorito e devolve o registro criado', async () => {
      const criado = { id: 7, tipo: 'LINHA', linhaId: '0.111-1' };
      pool.query.mockResolvedValue({ rows: [criado] });

      const resultado = await repository.adicionar({
        usuarioId: 3,
        tipo: 'LINHA',
        linhaId: '0.111-1',
      });

      const [sql, valores] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO favoritos');
      expect(sql).toContain('ON CONFLICT DO NOTHING');
      expect(sql).toContain('RETURNING');
      expect(valores).toEqual([3, 'LINHA', '0.111-1', null, null, null]);
      expect(resultado).toEqual(criado);
    });

    it('guarda origem e destino de um trajeto', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 8 }] });

      await repository.adicionar({
        usuarioId: 3,
        tipo: 'TRAJETO',
        origem: 'Asa Sul',
        destino: 'Rodoviária',
      });

      expect(pool.query.mock.calls[0][1]).toEqual([3, 'TRAJETO', null, null, 'Asa Sul', 'Rodoviária']);
    });

    it('devolve null quando o favorito já existia', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.adicionar({
        usuarioId: 3,
        tipo: 'PARADA',
        paradaId: 'P1',
      });

      expect(resultado).toBeNull();
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(
        repository.adicionar({ usuarioId: 3, tipo: 'LINHA', linhaId: 'X' })
      ).rejects.toThrow('falha no banco');
    });
  });

  describe('remover', () => {
    it('remove apenas o favorito que pertence ao usuário', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const resultado = await repository.remover(7, 3);

      const [sql, valores] = pool.query.mock.calls[0];
      expect(sql).toContain('DELETE FROM favoritos');
      expect(sql).toContain('WHERE id = $1 AND usuario_id = $2');
      expect(valores).toEqual([7, 3]);
      expect(resultado).toBe(true);
    });

    it('devolve false quando não há favorito para remover', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      expect(await repository.remover(99, 3)).toBe(false);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.remover(7, 3)).rejects.toThrow('falha no banco');
    });
  });
});