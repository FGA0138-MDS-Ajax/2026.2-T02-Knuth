jest.mock('../controllers/trajetosController', () => ({
  getTrajetos: jest.fn(),
}));

const trajetosController = require('../controllers/trajetosController');
const router = require('../routes/trajetosRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('trajetosRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual(['GET /']);
  });

  it('GET / usa trajetosController.getTrajetos', () => {
    const rota = buscarRota(router, 'GET', '/');

    expect(rota.handlers).toEqual([trajetosController.getTrajetos]);
  });
});
