const paradasService = require('../services/paradasService');
const paradasController = require('../controllers/paradasController');

jest.mock('../services/paradasService', () => ({
  obterParadaMaisProxima: jest.fn(),
}));

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// -----testes------
describe('ParadasController', () => {
  let erroSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('getParadaProxima', () => {
    it.each([
      [{}],
      [{ lat: '-15.79' }],
      [{ lng: '-47.88' }],
      [{ lat: '', lng: '' }],
    ])('responde 400 quando faltam parâmetros (%j)', async (query) => {
      const res = criarRes();

      await paradasController.getParadaProxima({ query }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'Os parâmetros lat e lng são obrigatórios.',
      });
      expect(paradasService.obterParadaMaisProxima).not.toHaveBeenCalled();
    });

    it('repassa lat e lng ao serviço e responde 200 com a parada', async () => {
      const parada = { id: 10, nome: 'Asa Sul - Quadra 704' };
      paradasService.obterParadaMaisProxima.mockResolvedValue(parada);
      const res = criarRes();

      await paradasController.getParadaProxima({ query: { lat: '-15.79', lng: '-47.88' } }, res);

      expect(paradasService.obterParadaMaisProxima).toHaveBeenCalledWith('-15.79', '-47.88');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(parada);
    });

    it('aceita a coordenada "0" como valor válido', async () => {
      paradasService.obterParadaMaisProxima.mockResolvedValue({ id: 1 });
      const res = criarRes();

      await paradasController.getParadaProxima({ query: { lat: '0', lng: '0' } }, res);

      expect(paradasService.obterParadaMaisProxima).toHaveBeenCalledWith('0', '0');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('responde 404 quando não há parada próxima', async () => {
      paradasService.obterParadaMaisProxima.mockResolvedValue(null);
      const res = criarRes();

      await paradasController.getParadaProxima({ query: { lat: '-15.79', lng: '-47.88' } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'NOT_FOUND',
        detalhes: 'Nenhuma parada encontrada próxima a esta localização.',
      });
    });

    it('responde 500 e registra o erro quando o serviço falha', async () => {
      const erro = new Error('falha no banco');
      paradasService.obterParadaMaisProxima.mockRejectedValue(erro);
      const res = criarRes();

      await paradasController.getParadaProxima({ query: { lat: '-15.79', lng: '-47.88' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar parada próxima.',
      });
      expect(erroSpy).toHaveBeenCalledWith('Erro ao buscar parada próxima:', erro);
    });
  });
});
