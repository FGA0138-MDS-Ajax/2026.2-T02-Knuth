jest.mock('../controllers/alertasController', () => ({
  getAlertasVigentes: jest.fn(),
  getAlertaVigenteById: jest.fn(),
}));

const alertasController = require('../controllers/alertasController');
const router = require('../routes/alertasRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('alertasRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual(['GET /', 'GET /:id']);
  });

  it('GET / (RF13) usa alertasController.getAlertasVigentes', () => {
    const rota = buscarRota(router, 'GET', '/');

    expect(rota.handlers).toEqual([alertasController.getAlertasVigentes]);
  });

  it('GET /:id (RF13) usa alertasController.getAlertaVigenteById', () => {
    const rota = buscarRota(router, 'GET', '/:id');

    expect(rota.handlers).toEqual([alertasController.getAlertaVigenteById]);
  });
});
