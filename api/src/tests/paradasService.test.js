jest.mock('../repositories/paradasRepository', () => ({
  findNearestParada: jest.fn(),
  buscarPorNome: jest.fn(),
}));

const paradasRepository = require('../repositories/paradasRepository');
const paradasService = require('../services/paradasService');

describe('ParadasService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('obterParadaMaisProxima', () => {
    it('repassa latitude e longitude ao repositório e retorna a parada', async () => {
      const parada = { id: 3, nome: 'Terminal Central', distancia: 120 };
      paradasRepository.findNearestParada.mockResolvedValue(parada);

      const resultado = await paradasService.obterParadaMaisProxima(-10.184, -48.333);

      expect(paradasRepository.findNearestParada).toHaveBeenCalledWith(-10.184, -48.333);
      expect(resultado).toBe(parada);
    });

    it('retorna null quando nenhuma parada é encontrada', async () => {
      paradasRepository.findNearestParada.mockResolvedValue(null);

      await expect(paradasService.obterParadaMaisProxima(0, 0)).resolves.toBeNull();
    });

    it('propaga o erro do repositório', async () => {
      paradasRepository.findNearestParada.mockRejectedValue(new Error('falha no banco'));

      await expect(paradasService.obterParadaMaisProxima(1, 1)).rejects.toThrow('falha no banco');
    });
  });

  describe('buscarParadas', () => {
    it('retorna lista vazia para termos com menos de 2 caracteres', async () => {
      await expect(paradasService.buscarParadas('a')).resolves.toEqual([]);
      await expect(paradasService.buscarParadas('  ')).resolves.toEqual([]);
      expect(paradasRepository.buscarPorNome).not.toHaveBeenCalled();
    });

    it('repassa o termo aparado e o limite válido ao repositório', async () => {
      const paradas = [{ id: '1', nome: 'UNB' }];
      paradasRepository.buscarPorNome.mockResolvedValue(paradas);

      const resultado = await paradasService.buscarParadas('  UnB  ', '8');

      expect(paradasRepository.buscarPorNome).toHaveBeenCalledWith('UnB', 8);
      expect(resultado).toEqual(paradas);
    });
  });
});
