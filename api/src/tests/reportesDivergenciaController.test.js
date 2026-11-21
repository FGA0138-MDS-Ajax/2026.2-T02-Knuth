const reportesDivergenciaService = require('../services/reportesDivergenciaService');
const reportesDivergenciaController = require('../controllers/reportesDivergenciaController');

jest.mock('../services/reportesDivergenciaService', () => ({
  registrarReporte: jest.fn(),
}));

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('ReportesDivergenciaController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('responde 201 com o reporte criado quando os dados são válidos', async () => {
    const body = {
      tipo: 'HORARIO',
      descricao: 'Horário de sábado está desatualizado.',
      linhaId: '0.110',
      paradaId: null,
      usuarioId: 2,
    };
    const criado = { id: 1, ...body, status: 'PENDENTE' };
    reportesDivergenciaService.registrarReporte.mockResolvedValue(criado);
    const res = criarRes();

    await reportesDivergenciaController.criar({ body }, res);

    expect(reportesDivergenciaService.registrarReporte).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(criado);
  });

  it('responde 400 quando o serviço rejeita por erro de validação', async () => {
    reportesDivergenciaService.registrarReporte.mockRejectedValue(
      new Error('Informe ao menos a linha ou a parada relacionada à divergência.')
    );
    const res = criarRes();

    await reportesDivergenciaController.criar(
      { body: { tipo: 'PARADA', descricao: 'Descrição válida.' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Informe ao menos a linha ou a parada relacionada à divergência.',
    });
  });

  it('responde 500 quando ocorre falha inesperada no servidor', async () => {
    reportesDivergenciaService.registrarReporte.mockRejectedValue(new Error('timeout no postgres'));
    const res = criarRes();

    await reportesDivergenciaController.criar({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Erro interno ao registrar reporte de divergência.',
    });
  });
});