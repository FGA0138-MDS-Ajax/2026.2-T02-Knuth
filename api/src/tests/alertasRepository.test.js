const pool = require('../config/database');
const AlertasRepository = require('../repositories/alertasRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

describe('AlertasRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('findAlertasVigentes', () => {
    it('executa a query correta e retorna linhas de alertas', async () => {
      const alertas = [
        { id: 1, tipo: 'DESVIO', descricao: 'Obras na via' },
        { id: 2, tipo: 'SUSPENSAO', descricao: 'Linha parada' },
      ];
      pool.query.mockResolvedValue({ rows: alertas });

      const resultado = await AlertasRepository.findAlertasVigentes();

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('FROM alertas a'));
      expect(resultado).toEqual(alertas);
    });

    it('propaga erro da query', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(AlertasRepository.findAlertasVigentes()).rejects.toThrow('falha no banco');
    });
  });

  describe('findAlertaVigenteById', () => {
    it('executa a query correta e retorna alerta pelo id', async () => {
      const alerta = { id: 1, tipo: 'DESVIO', descricao: 'Obras na via' };
      pool.query.mockResolvedValue({ rows: [alerta] });

      const resultado = await AlertasRepository.findAlertaVigenteById(1);

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE a.id = $1'), [1]);
      expect(resultado).toEqual(alerta);
    });

    it('retorna null se não encontrar alerta', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await AlertasRepository.findAlertaVigenteById(99);

      expect(resultado).toBeNull();
    });

    it('propaga erro da query', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(AlertasRepository.findAlertaVigenteById(1)).rejects.toThrow('falha no banco');
    });
  });
});
