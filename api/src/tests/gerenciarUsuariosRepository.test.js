const pool = require('../src/config/database');
const repository = require('../src/repositories/gerenciarUsuariosRepository');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

// -----testes------
describe('GerenciarUsuariosRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listar', () => {
    it('lista todos os usuários ordenados por id quando não há filtro', async () => {
      const usuarios = [{ id: 1 }, { id: 2 }];
      pool.query.mockResolvedValue({ rows: usuarios });

      const resultado = await repository.listar();

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM usuarios');
      expect(sql).not.toContain('WHERE');
      expect(sql).toContain('ORDER BY id');
      expect(params).toEqual([]);
      expect(resultado).toEqual(usuarios);
    });

    it('filtra pelo tipo quando ele é informado', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, tipo: 'ADMIN' }] });

      await repository.listar('ADMIN');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE tipo = $1');
      expect(sql).toContain('ORDER BY id');
      expect(params).toEqual(['ADMIN']);
    });

    it('não devolve a senha na consulta', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.listar();

      expect(pool.query.mock.calls[0][0]).not.toContain('senha');
    });
  });

  describe('buscarPorId', () => {
    it('devolve o usuário encontrado', async () => {
      const usuario = { id: 7, nome: 'Maria', email: 'maria@email.com', tipo: 'PASSAGEIRO' };
      pool.query.mockResolvedValue({ rows: [usuario] });

      const resultado = await repository.buscarPorId(7);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE id = $1');
      expect(params).toEqual([7]);
      expect(resultado).toEqual(usuario);
    });

    it('devolve null quando o usuário não existe', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.buscarPorId(99);

      expect(resultado).toBeNull();
    });
  });

  describe('contarAdmins', () => {
    it('devolve o total de administradores', async () => {
      pool.query.mockResolvedValue({ rows: [{ total: 3 }] });

      const resultado = await repository.contarAdmins();

      expect(pool.query.mock.calls[0][0]).toContain("tipo = 'ADMIN'");
      expect(resultado).toBe(3);
    });
  });

  describe('atualizar', () => {
    it('envia os valores na ordem esperada pela consulta e devolve o usuário atualizado', async () => {
      const atualizado = { id: 7, nome: 'Maria Souza', email: 'maria@email.com', tipo: 'ADMIN' };
      pool.query.mockResolvedValue({ rows: [atualizado] });

      const resultado = await repository.atualizar(
        7,
        'Maria Souza',
        'maria@email.com',
        'hash-novo',
        'ADMIN'
      );

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('UPDATE usuarios');
      expect(sql).toContain('SET nome = $2, email = $3, tipo = $5, senha_hash = COALESCE($4, senha_hash)');
      expect(sql).toContain('WHERE id = $1');
      expect(params).toEqual([7, 'Maria Souza', 'maria@email.com', 'hash-novo', 'ADMIN']);
      expect(resultado).toEqual(atualizado);
    });

    it('envia null no lugar da senha para mantê-la como está', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 7 }] });

      await repository.atualizar(7, 'Maria', 'maria@email.com', null, 'PASSAGEIRO');

      expect(pool.query.mock.calls[0][1][3]).toBeNull();
    });
  });

  describe('excluir', () => {
    it('remove o usuário pelo id e não devolve nada', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.excluir(7);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('DELETE FROM usuarios WHERE id = $1');
      expect(params).toEqual([7]);
      expect(resultado).toBeUndefined();
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.excluir(7)).rejects.toThrow('falha no banco');
    });
  });
});
