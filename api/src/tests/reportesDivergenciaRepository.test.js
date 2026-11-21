const pool = require('../config/database');
const reportesDivergenciaRepository = require('../repositories/reportesDivergenciaRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

describe('ReportesDivergenciaRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('insere um reporte de divergência e retorna o registro criado', async () => {
    const registroCriado = {
      id: 1,
      tipo: 'HORARIO',
      descricao: 'O ônibus das 07:30 não passou no ponto.',
      linhaId: '0.110',
      paradaId: null,
      usuarioId: 3,
      status: 'PENDENTE',
      criadoEm: '2026-11-20T21:00:00.000Z',
    };
    pool.query.mockResolvedValue({ rows: [registroCriado] });

    const resultado = await reportesDivergenciaRepository.criar({
      tipo: 'HORARIO',
      descricao: 'O ônibus das 07:30 não passou no ponto.',
      linhaId: '0.110',
      usuarioId: 3,
    });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO reportes_divergencia'),
      ['HORARIO', 'O ônibus das 07:30 não passou no ponto.', '0.110', null, 3]
    );
    expect(resultado).toEqual(registroCriado);
  });

  it('propaga erro quando o banco falha', async () => {
    pool.query.mockRejectedValue(new Error('erro de conexão'));

    await expect(
      reportesDivergenciaRepository.criar({
        tipo: 'PARADA',
        descricao: 'Parada desativada na via principal.',
        paradaId: 'P100',
      })
    ).rejects.toThrow('erro de conexão');
  });
});