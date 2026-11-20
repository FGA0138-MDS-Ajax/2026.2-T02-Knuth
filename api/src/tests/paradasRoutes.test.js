jest.mock('../controllers/paradasController', () => ({
  getParadaProxima: jest.fn(),
}));

const paradasController = require('../controllers/paradasController');
const router = require('../routes/paradasRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('paradasRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual(['GET /proximas']);
  });

  it('GET /proximas usa paradasController.getParadaProxima', () => {
    const rota = buscarRota(router, 'GET', '/proximas');

    expect(rota.handlers).toEqual([paradasController.getParadaProxima]);
  });
});
