const pool = require('../src/config/database');
const repository = require('../src/repositories/adminRepository');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

// -----testes------
describe('AdminRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('criar', () => {
    it('insere o usuário com tipo ADMIN e devolve a primeira linha retornada', async () => {
      const admin = { id: 5, nome: 'Carlos Souza', email: 'carlos@email.com', tipo: 'ADMIN' };
      pool.query.mockResolvedValue({ rows: [admin] });

      const resultado = await repository.criar('Carlos Souza', 'carlos@email.com', 'hash123');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO usuarios (nome, email, senha_hash, tipo)');
      expect(sql).toContain("VALUES ($1, $2, $3, 'ADMIN')");
      expect(sql).toContain('RETURNING id, nome, email, tipo');
      expect(params).toEqual(['Carlos Souza', 'carlos@email.com', 'hash123']);
      expect(resultado).toEqual(admin);
    });

    it('não permite informar o tipo por parâmetro', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 5 }] });

      await repository.criar('Carlos Souza', 'carlos@email.com', 'hash123', 'PASSAGEIRO');

      expect(pool.query.mock.calls[0][1]).toHaveLength(3);
    });

    it('propaga o erro do banco, como e-mail duplicado', async () => {
      pool.query.mockRejectedValue(new Error('duplicate key value'));

      await expect(
        repository.criar('Carlos Souza', 'carlos@email.com', 'hash123')
      ).rejects.toThrow('duplicate key value');
    });
  });
});
