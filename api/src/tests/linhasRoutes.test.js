jest.mock('../controllers/linhasController', () => ({
  getLinhas: jest.fn(),
  getItinerario: jest.fn(),
  getHorarios: jest.fn(),
}));

const linhasController = require('../controllers/linhasController');
const router = require('../routes/linhasRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('linhasRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual([
      'GET /',
      'GET /:id/itinerario',
      'GET /:id/horarios',
    ]);
  });

  it('GET / (RF07) usa linhasController.getLinhas', () => {
    const rota = buscarRota(router, 'GET', '/');

    expect(rota.handlers).toEqual([linhasController.getLinhas]);
  });

  it('GET /:id/itinerario (RF08) usa linhasController.getItinerario', () => {
    const rota = buscarRota(router, 'GET', '/:id/itinerario');

    expect(rota.handlers).toEqual([linhasController.getItinerario]);
  });

  it('GET /:id/horarios (RF10) usa linhasController.getHorarios', () => {
    const rota = buscarRota(router, 'GET', '/:id/horarios');

    expect(rota.handlers).toEqual([linhasController.getHorarios]);
  });
});
