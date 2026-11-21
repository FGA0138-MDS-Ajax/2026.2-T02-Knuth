const pool = require('../config/database');
const repository = require('../repositories/recuperacaoSenhaRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// -----testes------
describe('RecuperacaoSenhaRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('invalidarPendentes', () => {
    it('marca como usados todos os códigos pendentes do usuário', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.invalidarPendentes(7);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('UPDATE recuperacoes_senha');
      expect(sql).toContain('SET usado_em = NOW()');
      expect(sql).toContain('WHERE usuario_id = $1 AND usado_em IS NULL');
      expect(params).toEqual([7]);
    });
  });

  describe('criar', () => {
    it('insere o hash do código com a validade e devolve o registro sem o hash', async () => {
      const expiraEm = new Date('2026-11-20T20:00:00Z');
      const registro = { id: 1, usuario_id: 7, expira_em: expiraEm };
      pool.query.mockResolvedValue({ rows: [registro] });

      const resultado = await repository.criar(7, 'hash-do-codigo', expiraEm);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO recuperacoes_senha (usuario_id, codigo_hash, expira_em)');
      expect(sql).not.toMatch(/RETURNING[^;]*codigo_hash/);
      expect(params).toEqual([7, 'hash-do-codigo', expiraEm]);
      expect(resultado).toEqual(registro);
    });
  });

  describe('buscarAtiva', () => {
    it('busca o código mais recente, não usado e não expirado', async () => {
      const registro = { id: 1, usuario_id: 7, codigo_hash: 'hash', tentativas: 0 };
      pool.query.mockResolvedValue({ rows: [registro] });

      const resultado = await repository.buscarAtiva(7);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('usado_em IS NULL');
      expect(sql).toContain('expira_em > NOW()');
      expect(sql).toContain('ORDER BY criado_em DESC');
      expect(sql).toContain('LIMIT 1');
      expect(params).toEqual([7]);
      expect(resultado).toEqual(registro);
    });

    it('devolve null quando não há código ativo', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      expect(await repository.buscarAtiva(7)).toBeNull();
    });
  });

  describe('registrarTentativa', () => {
    it('incrementa as tentativas e devolve o novo total', async () => {
      pool.query.mockResolvedValue({ rows: [{ tentativas: 3 }] });

      const resultado = await repository.registrarTentativa(1);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('SET tentativas = tentativas + 1');
      expect(params).toEqual([1]);
      expect(resultado).toBe(3);
    });

    it('devolve 0 quando o registro não existe', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      expect(await repository.registrarTentativa(99)).toBe(0);
    });
  });

  describe('marcarUsada', () => {
    it('marca o código como usado', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.marcarUsada(1);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('UPDATE recuperacoes_senha SET usado_em = NOW() WHERE id = $1');
      expect(params).toEqual([1]);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.marcarUsada(1)).rejects.toThrow('falha no banco');
    });
  });
});
