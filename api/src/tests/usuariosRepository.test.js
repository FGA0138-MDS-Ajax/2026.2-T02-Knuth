const pool = require('../config/database');
const repository = require('../repositories/usuariosRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// -----testes------
describe('UsuariosRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('criar', () => {
    it('insere o usuário e devolve a primeira linha retornada', async () => {
      const usuario = { id: 1, nome: 'Maria Silva', email: 'maria@email.com', tipo: 'PASSAGEIRO' };
      pool.query.mockResolvedValue({ rows: [usuario] });

      const resultado = await repository.criar('Maria Silva', 'maria@email.com', 'hash123');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO usuarios (nome, email, senha_hash)');
      expect(sql).toContain('RETURNING id, nome, email, tipo');
      expect(params).toEqual(['Maria Silva', 'maria@email.com', 'hash123']);
      expect(resultado).toEqual(usuario);
    });

    it('não define o tipo na inserção, deixando o valor padrão do banco', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await repository.criar('Maria Silva', 'maria@email.com', 'hash123');

      expect(pool.query.mock.calls[0][0]).not.toContain("'ADMIN'");
    });

    it('não devolve o hash da senha', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await repository.criar('Maria Silva', 'maria@email.com', 'hash123');

      expect(pool.query.mock.calls[0][0]).not.toMatch(/RETURNING[^;]*senha_hash/);
    });

    it('propaga o erro do banco, como e-mail duplicado', async () => {
      pool.query.mockRejectedValue(new Error('duplicate key value'));

      await expect(
        repository.criar('Maria Silva', 'maria@email.com', 'hash123')
      ).rejects.toThrow('duplicate key value');
    });
  });

  describe('buscarPorEmail', () => {
    it('devolve o usuário encontrado', async () => {
      const usuario = { id: 1, email: 'maria@email.com', senha_hash: 'hash123' };
      pool.query.mockResolvedValue({ rows: [usuario] });

      const resultado = await repository.buscarPorEmail('maria@email.com');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('SELECT * FROM usuarios WHERE email = $1');
      expect(params).toEqual(['maria@email.com']);
      expect(resultado).toEqual(usuario);
    });

    it('devolve null quando o e-mail não está cadastrado', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.buscarPorEmail('inexistente@email.com');

      expect(resultado).toBeNull();
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.buscarPorEmail('maria@email.com')).rejects.toThrow('falha no banco');
    });
  });
});

// ---------- RF16: recuperação de senha e exclusão de conta ----------
describe('UsuariosRepository - RF16', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('buscarPorId', () => {
    it('devolve o usuário encontrado pelo id', async () => {
      const usuario = { id: 7, email: 'maria@email.com', senha_hash: 'hash' };
      pool.query.mockResolvedValue({ rows: [usuario] });

      const resultado = await repository.buscarPorId(7);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('SELECT * FROM usuarios WHERE id = $1');
      expect(params).toEqual([7]);
      expect(resultado).toEqual(usuario);
    });

    it('devolve null quando o usuário não existe', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      expect(await repository.buscarPorId(99)).toBeNull();
    });
  });

  describe('atualizarSenha', () => {
    it('atualiza apenas o hash da senha do usuário', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.atualizarSenha(7, 'novo-hash');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('UPDATE usuarios SET senha_hash = $2 WHERE id = $1');
      expect(params).toEqual([7, 'novo-hash']);
    });
  });

  describe('excluir', () => {
    it('remove o usuário pelo id', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.excluir(7);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('DELETE FROM usuarios WHERE id = $1');
      expect(params).toEqual([7]);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.excluir(7)).rejects.toThrow('falha no banco');
    });
  });
});
