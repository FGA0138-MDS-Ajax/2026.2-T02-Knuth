jest.mock('../repositories/alertasRepository', () => ({
  findAlertasVigentes: jest.fn(),
  findAlertaVigenteById: jest.fn(),
}));

const alertasRepository = require('../repositories/alertasRepository');
const alertasService = require('../services/alertasService');

describe('AlertasService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listarAlertasVigentes (RF13)', () => {
    it('retorna os alertas vigentes devolvidos pelo repositório', async () => {
      const alertas = [
        { id: 1, titulo: 'Desvio na Av. JK' },
        { id: 2, titulo: 'Linha 101 com atraso' },
      ];
      alertasRepository.findAlertasVigentes.mockResolvedValue(alertas);

      const resultado = await alertasService.listarAlertasVigentes();

      expect(resultado).toBe(alertas);
      expect(alertasRepository.findAlertasVigentes).toHaveBeenCalledTimes(1);
    });

    it('retorna lista vazia quando não há alertas vigentes', async () => {
      alertasRepository.findAlertasVigentes.mockResolvedValue([]);

      await expect(alertasService.listarAlertasVigentes()).resolves.toEqual([]);
    });

    it('propaga o erro do repositório', async () => {
      alertasRepository.findAlertasVigentes.mockRejectedValue(new Error('falha no banco'));

      await expect(alertasService.listarAlertasVigentes()).rejects.toThrow('falha no banco');
    });
  });

  describe('obterAlertaVigente (RF13)', () => {
    it('consulta o repositório pelo id e retorna o alerta', async () => {
      const alerta = { id: 7, titulo: 'Parada desativada' };
      alertasRepository.findAlertaVigenteById.mockResolvedValue(alerta);

      const resultado = await alertasService.obterAlertaVigente(7);

      expect(alertasRepository.findAlertaVigenteById).toHaveBeenCalledWith(7);
      expect(resultado).toBe(alerta);
    });

    it('retorna null quando o alerta não existe ou não está vigente', async () => {
      alertasRepository.findAlertaVigenteById.mockResolvedValue(null);

      await expect(alertasService.obterAlertaVigente(999)).resolves.toBeNull();
    });

    it('propaga o erro do repositório', async () => {
      alertasRepository.findAlertaVigenteById.mockRejectedValue(new Error('falha no banco'));

      await expect(alertasService.obterAlertaVigente(1)).rejects.toThrow('falha no banco');
    });
  });
});
