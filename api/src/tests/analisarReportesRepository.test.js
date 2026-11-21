const pool = require('../config/database');
const repository = require('../repositories/analisarReportesRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// -----testes------
describe('AnalisarReportesRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listar', () => {
    it('lista todos os reportes sem filtros priorizando pendentes e mais recentes', async () => {
      const lista = [{ id: 1, tipo: 'HORARIO', status: 'PENDENTE' }];
      pool.query.mockResolvedValue({ rows: lista });

      const resultado = await repository.listar();

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM reportes_divergencia r');
      expect(sql).toContain('LEFT JOIN usuarios u ON u.id = r.usuario_id');
      expect(sql).toContain("CASE WHEN r.status = 'PENDENTE' THEN 0 ELSE 1 END");
      expect(sql).not.toContain('WHERE');
      expect(params).toEqual([]);
      expect(resultado).toEqual(lista);
    });

    it('filtra por status quando informado', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.listar({ status: 'PROCEDENTE' });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE r.status = $1');
      expect(params).toEqual(['PROCEDENTE']);
    });

    it('filtra por tipo quando informado', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.listar({ tipo: 'PARADA' });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE r.tipo = $1');
      expect(params).toEqual(['PARADA']);
    });

    it('combina filtros de status e tipo', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.listar({ status: 'PENDENTE', tipo: 'ITINERARIO' });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE r.status = $1 AND r.tipo = $2');
      expect(params).toEqual(['PENDENTE', 'ITINERARIO']);
    });

    it('propaga erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.listar()).rejects.toThrow('falha no banco');
    });
  });

  describe('buscarPorId', () => {
    it('retorna o reporte encontrado pelo ID', async () => {
      const reporte = { id: 4, tipo: 'PARADA', status: 'PENDENTE', usuarioNome: 'Maria' };
      pool.query.mockResolvedValue({ rows: [reporte] });

      const resultado = await repository.buscarPorId(4);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE r.id = $1');
      expect(params).toEqual([4]);
      expect(resultado).toEqual(reporte);
    });

    it('retorna null quando não encontra o reporte', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      expect(await repository.buscarPorId(99)).toBeNull();
    });
  });

  describe('atualizarAnalise', () => {
    it('atualiza status, observação e analisado_em e retorna o reporte atualizado', async () => {
      const atualizado = {
        id: 4,
        status: 'PROCEDENTE',
        observacaoAdmin: 'Horário corrigido no quadro.',
        analisadoEm: '2026-11-21T13:00:00Z',
      };
      pool.query.mockResolvedValue({ rows: [atualizado] });

      const resultado = await repository.atualizarAnalise(
        4,
        'PROCEDENTE',
        'Horário corrigido no quadro.'
      );

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('UPDATE reportes_divergencia');
      expect(sql).toContain('status = $2');
      expect(sql).toContain('observacao_admin = $3');
      expect(sql).toContain("CASE WHEN $2 = 'PENDENTE' THEN NULL ELSE NOW() END");
      expect(params).toEqual([4, 'PROCEDENTE', 'Horário corrigido no quadro.']);
      expect(resultado).toEqual(atualizado);
    });

    it('retorna null quando nenhum registro é atualizado', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      expect(await repository.atualizarAnalise(99, 'IMPROCEDENTE', null)).toBeNull();
    });
  });
});
