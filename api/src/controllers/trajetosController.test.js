const trajetosController = require('./trajetosController');
const trajetosService = require('../services/trajetosService');

// Isolamos o serviço para testar estritamente a responsabilidade do Controlador
jest.mock('../services/trajetosService');

describe('TrajetosController', () => {
  let req;
  let res;

  // Antes de cada teste, recriamos os objetos simulados do Express para evitar contaminação
  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('deve retornar status 400 (Bad Request) se faltarem parâmetros obrigatórios', async () => {
    // Simulando a requisição faltando 'destino_lng'
    req.query = {
      origem_lat: '-15.8',
      origem_lng: '-47.9',
      destino_lat: '-15.9'
    };

    await trajetosController.buscar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: "Parâmetros inválidos.",
      detalhes: "As coordenadas de origem (lat/lng) e destino (lat/lng) são obrigatórias."
    });
  });

  it('deve retornar status 200 (OK) e repassar os dados ao serviço no caminho feliz', async () => {
    // Simulando a requisição com todas as coordenadas corretas
    req.query = {
      origem_lat: '-15.8',
      origem_lng: '-47.9',
      destino_lat: '-15.9',
      destino_lng: '-48.0',
      criterio: 'MENOR_TEMPO'
    };

    // Forçamos o serviço falso a retornar um array de resposta simulado
    const mockOpcoesTrajeto = [{ duracaoMinutos: 45, etapas: [] }];
    trajetosService.buscar.mockResolvedValue(mockOpcoesTrajeto);

    await trajetosController.buscar(req, res);

    // O controlador deve chamar o serviço com os mesmos parâmetros que recebeu
    expect(trajetosService.buscar).toHaveBeenCalledWith({
      origem_lat: '-15.8',
      origem_lng: '-47.9',
      destino_lat: '-15.9',
      destino_lng: '-48.0',
      criterio: 'MENOR_TEMPO'
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockOpcoesTrajeto);
  });
});