jest.mock('../controllers/paradasController', () => ({
  buscarParadas: jest.fn(),
  getParadaProxima: jest.fn(),
}));

const paradasController = require('../controllers/paradasController');
const router = require('../routes/paradasRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('paradasRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual(['GET /', 'GET /proximas']);
  });

  it('GET / usa paradasController.buscarParadas', () => {
    const rota = buscarRota(router, 'GET', '/');

    expect(rota.handlers).toEqual([paradasController.buscarParadas]);
  });

  it('GET /proximas usa paradasController.getParadaProxima', () => {
    const rota = buscarRota(router, 'GET', '/proximas');

    expect(rota.handlers).toEqual([paradasController.getParadaProxima]);
  });
});
