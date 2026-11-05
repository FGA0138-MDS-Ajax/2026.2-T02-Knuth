const linhasController = require('./linhasController'); // Importa o seu controller
const linhasService = require('../services/linhasService'); // Importa o service

jest.mock('../services/linhasService');

describe('LinhasController', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getItinerario', () => {
    
    test('Deve retornar status 400 se o ID for uma letra (inválido)', async () => {
      const req = { params: { id: 'abc' } }; // Simulamos um usuário enviando letras
      const res = {
        status: jest.fn().mockReturnThis(), // Retorna o próprio 'res' para encadear o .json()
        json: jest.fn()
      };

      await linhasController.getItinerario(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        codigo: 'BAD_REQUEST',
        mensagem: 'O ID da linha deve ser um número válido.'
      });
      
      expect(linhasService.obterItinerario).not.toHaveBeenCalled();
    });

  });
});