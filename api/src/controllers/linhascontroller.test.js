const linhasController = require('./linhasController'); // Importa o seu controller
const linhasService = require('../services/linhasService'); // Importa o service

jest.mock('../services/linhasService');

describe('LinhasController', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // RF02 - Testes para Busca e Filtragem de Linhas
  describe('getLinhas (RF02 - Filtros)', () => {

    test('Deve retornar status 200 e a lista de linhas filtradas com sucesso', async () => {
      const req = {
        query: { bacia: '1', regiao: 'Gama', tipo: 'Circulacao' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockLinhas = [
        { id: 1, codigo: '0.224', nome: 'Gama / Rod. Plano Piloto', cor: '#0055A5' }
      ];

      linhasService.obterLinhas.mockResolvedValue(mockLinhas);

      await linhasController.getLinhas(req, res);

      expect(linhasService.obterLinhas).toHaveBeenCalledWith({
        busca: undefined,
        bacia: '1',
        regiao: 'Gama',
        tipo: 'Circulacao'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockLinhas);
    });

    test('Deve retornar status 500 caso ocorra erro interno no serviço', async () => {
      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      linhasService.obterLinhas.mockRejectedValue(new Error('Erro de conexão com o banco'));

      await linhasController.getLinhas(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar linhas.'
      });
    });

  });

  describe('getItinerario', () => {
    
    test('Deve retornar status 400 se o ID for uma letra (inválido)', async () => {
      const req = { params: { id: 'abc' }, query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await linhasController.getItinerario(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'O ID da linha é obrigatório.'
      });
      
      expect(linhasService.obterItinerario).not.toHaveBeenCalled();
    });

  });
});