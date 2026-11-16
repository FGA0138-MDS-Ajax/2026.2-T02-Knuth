const alertasService = require('../services/alertasService');
const alertasController = require('../controllers/alertasController');

jest.mock('../services/alertasService');

describe('AlertasController', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  // --- GET /api/v1/alertas ---

  test('Deve listar os alertas vigentes com sucesso (HTTP 200)', async () => {
    const mockAlertas = [
      {
        id: 1,
        tipo: 'DESVIO',
        descricao: 'Desvio na Rodoviária do Plano Piloto',
        data_inicio: '2026-11-01T00:00:00Z',
        data_fim: '2026-11-30T23:59:59Z',
        linhas_afetadas: [{ id: '10', codigo: '0.110', nome: 'TAGUATINGA / RODOVIÁRIA' }],
        paradas_afetadas: []
      }
    ];

    alertasService.listarAlertasVigentes.mockResolvedValue(mockAlertas);

    await alertasController.getAlertasVigentes(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockAlertas);
  });

  test('Deve retornar lista vazia quando não há alertas vigentes (HTTP 200)', async () => {
    alertasService.listarAlertasVigentes.mockResolvedValue([]);

    await alertasController.getAlertasVigentes(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('Deve retornar HTTP 500 em caso de erro interno ao listar alertas', async () => {
    alertasService.listarAlertasVigentes.mockRejectedValue(new Error('Erro de banco'));

    await alertasController.getAlertasVigentes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'INTERNAL_ERROR',
      detalhes: 'Erro interno ao listar os alertas vigentes.'
    });
  });

  // --- GET /api/v1/alertas/:id ---

  test('Deve retornar um alerta vigente pelo id com sucesso (HTTP 200)', async () => {
    req.params = { id: '1' };
    const mockAlerta = {
      id: 1,
      tipo: 'SUSPENSAO',
      descricao: 'Linha suspensa por greve',
      data_inicio: '2026-11-10T00:00:00Z',
      data_fim: '2026-11-20T23:59:59Z',
      linhas_afetadas: [{ id: '5', codigo: '0.600', nome: 'GAMA / RODOVIÁRIA' }],
      paradas_afetadas: []
    };

    alertasService.obterAlertaVigente.mockResolvedValue(mockAlerta);

    await alertasController.getAlertaVigenteById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockAlerta);
  });

  test('Deve retornar HTTP 404 quando alerta vigente não for encontrado', async () => {
    req.params = { id: '999' };
    alertasService.obterAlertaVigente.mockResolvedValue(null);

    await alertasController.getAlertaVigenteById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'NOT_FOUND',
      detalhes: 'Alerta vigente não encontrado para o ID informado.'
    });
  });

  test('Deve retornar HTTP 400 quando o id não for informado', async () => {
    req.params = { id: '' };

    await alertasController.getAlertaVigenteById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'BAD_REQUEST',
      detalhes: 'O ID do alerta é obrigatório.'
    });
  });

  test('Deve retornar HTTP 500 em caso de erro interno ao consultar alerta por id', async () => {
    req.params = { id: '1' };
    alertasService.obterAlertaVigente.mockRejectedValue(new Error('Falha na query'));

    await alertasController.getAlertaVigenteById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'INTERNAL_ERROR',
      detalhes: 'Erro interno ao consultar o alerta vigente.'
    });
  });
});
