const buscasRecentesService = require('../services/buscasRecentesService');
const buscasRecentesController = require('../controllers/buscasRecentesController');

jest.mock('../services/buscasRecentesService');

describe('BuscasRecentesController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Deve registrar uma busca recente com sucesso (HTTP 201)', async () => {
    req.body = { origem: 'Taguatinga', destino: 'Plano Piloto' };
    const mockResultado = { id: 1, origem: 'Taguatinga', destino: 'Plano Piloto', realizadaEm: new Date() };

    buscasRecentesService.registrarBusca.mockResolvedValue(mockResultado);

    await buscasRecentesController.salvar(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResultado);
  });

  test('Deve retornar erro HTTP 400 se faltar origem ou destino', async () => {
    req.body = { origem: 'Taguatinga' };
    buscasRecentesService.registrarBusca.mockRejectedValue(new Error('Origem e destino são obrigatórios.'));

    await buscasRecentesController.salvar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Origem e destino são obrigatórios.' });
  });

  test('Deve listar as buscas recentes com sucesso (HTTP 200)', async () => {
    const mockLista = [
      { id: 1, origem: 'Gama', destino: 'Plano Piloto', realizadaEm: new Date() }
    ];
    buscasRecentesService.obterBuscasRecentes.mockResolvedValue(mockLista);

    await buscasRecentesController.listar(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockLista);
  });
});