const alertasService = require('../src/services/alertasService');
const alertasController = require('../src/controllers/alertasController');

jest.mock('../src/services/alertasService', () => ({
  listarAlertasVigentes: jest.fn(),
  obterAlertaVigente: jest.fn(),
}));

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// -----testes------
describe('AlertasController', () => {
  let erroSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('getAlertasVigentes', () => {
    it('responde 200 com os alertas vigentes', async () => {
      const alertas = [{ id: 1, tipo: 'DESVIO' }, { id: 2, tipo: 'SUSPENSAO' }];
      alertasService.listarAlertasVigentes.mockResolvedValue(alertas);
      const res = criarRes();

      await alertasController.getAlertasVigentes({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(alertas);
    });

    it('responde 200 com lista vazia quando não há alertas', async () => {
      alertasService.listarAlertasVigentes.mockResolvedValue([]);
      const res = criarRes();

      await alertasController.getAlertasVigentes({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('responde 500 e registra o erro quando o serviço falha', async () => {
      const erro = new Error('falha no banco');
      alertasService.listarAlertasVigentes.mockRejectedValue(erro);
      const res = criarRes();

      await alertasController.getAlertasVigentes({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao listar os alertas vigentes.',
      });
      expect(erroSpy).toHaveBeenCalledWith('Erro ao listar alertas vigentes:', erro);
    });
  });

  describe('getAlertaVigenteById', () => {
    it.each([[undefined], [''], ['   ']])('responde 400 quando o id é vazio (%j)', async (id) => {
      const res = criarRes();

      await alertasController.getAlertaVigenteById({ params: { id } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'O ID do alerta é obrigatório.',
      });
      expect(alertasService.obterAlertaVigente).not.toHaveBeenCalled();
    });

    it('responde 400 quando a requisição não tem params', async () => {
      const res = criarRes();

      await alertasController.getAlertaVigenteById({}, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 200 com o alerta encontrado', async () => {
      const alerta = { id: 3, tipo: 'PARALISACAO', descricao: 'Paralisação geral' };
      alertasService.obterAlertaVigente.mockResolvedValue(alerta);
      const res = criarRes();

      await alertasController.getAlertaVigenteById({ params: { id: '3' } }, res);

      expect(alertasService.obterAlertaVigente).toHaveBeenCalledWith('3');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(alerta);
    });

    it('responde 404 quando o alerta não existe ou não está vigente', async () => {
      alertasService.obterAlertaVigente.mockResolvedValue(null);
      const res = criarRes();

      await alertasController.getAlertaVigenteById({ params: { id: '99' } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'NOT_FOUND',
        detalhes: 'Alerta vigente não encontrado para o ID informado.',
      });
    });

    it('responde 500 e registra o erro quando o serviço falha', async () => {
      const erro = new Error('falha no banco');
      alertasService.obterAlertaVigente.mockRejectedValue(erro);
      const res = criarRes();

      await alertasController.getAlertaVigenteById({ params: { id: '3' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao consultar o alerta vigente.',
      });
      expect(erroSpy).toHaveBeenCalledWith('Erro ao consultar alerta vigente:', erro);
    });
  });
});
