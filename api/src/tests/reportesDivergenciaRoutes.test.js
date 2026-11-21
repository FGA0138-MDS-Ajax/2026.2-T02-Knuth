jest.mock('../controllers/reportesDivergenciaController', () => ({
  criar: jest.fn(),
}));

const reportesDivergenciaController = require('../controllers/reportesDivergenciaController');
const router = require('../routes/reportesDivergenciaRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('reportesDivergenciaRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual(['POST /']);
  });

  it('POST / encaminha para reportesDivergenciaController.criar', () => {
    const rota = buscarRota(router, 'POST', '/');

    expect(rota).toBeDefined();
    expect(rota.handlers).toHaveLength(1);

    const req = {
      body: {
        tipo: 'HORARIO',
        descricao: 'Horário da linha não corresponde ao exibido.',
        linhaId: '0.110',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    rota.handlers[0](req, res);

    expect(reportesDivergenciaController.criar).toHaveBeenCalledWith(req, res);
  });

  it('não expõe / via GET', () => {
    expect(buscarRota(router, 'GET', '/')).toBeUndefined();
  });
});