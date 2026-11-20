jest.mock('../controllers/buscasRecentesController', () => ({
  salvar: jest.fn(),
  listar: jest.fn(),
}));

const buscasRecentesController = require('../controllers/buscasRecentesController');
const router = require('../routes/buscasRecentesRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('buscasRecentesRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual(['POST /buscas-recentes', 'GET /buscas-recentes']);
  });

  it('POST /buscas-recentes encaminha (req, res) para buscasRecentesController.salvar', () => {
    const rota = buscarRota(router, 'POST', '/buscas-recentes');
    const req = { body: { origem: 'A', destino: 'B' } };
    const res = {};

    expect(rota.handlers).toHaveLength(1);
    rota.handlers[0](req, res);

    expect(buscasRecentesController.salvar).toHaveBeenCalledWith(req, res);
    expect(buscasRecentesController.listar).not.toHaveBeenCalled();
  });

  it('GET /buscas-recentes encaminha (req, res) para buscasRecentesController.listar', () => {
    const rota = buscarRota(router, 'GET', '/buscas-recentes');
    const req = { query: { limite: '3' } };
    const res = {};

    expect(rota.handlers).toHaveLength(1);
    rota.handlers[0](req, res);

    expect(buscasRecentesController.listar).toHaveBeenCalledWith(req, res);
    expect(buscasRecentesController.salvar).not.toHaveBeenCalled();
  });
});
