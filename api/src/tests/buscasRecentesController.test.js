const buscasRecentesService = require('../services/buscasRecentesService');
const buscasRecentesController = require('../controllers/buscasRecentesController');

jest.mock('../services/buscasRecentesService', () => ({
  registrarBusca: jest.fn(),
  obterBuscasRecentes: jest.fn(),
}));

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// -----testes------
describe('BuscasRecentesController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('salvar', () => {
    const body = { origem: 'Asa Sul', destino: 'Rodoviária', usuarioId: 1 };

    it('repassa origem, destino e usuário do corpo ao serviço', async () => {
      buscasRecentesService.registrarBusca.mockResolvedValue({ id: 1 });

      await buscasRecentesController.salvar({ body }, criarRes());

      expect(buscasRecentesService.registrarBusca).toHaveBeenCalledWith('Asa Sul', 'Rodoviária', 1);
    });

    it('responde 201 com a busca registrada', async () => {
      const novaBusca = { id: 1, ...body };
      buscasRecentesService.registrarBusca.mockResolvedValue(novaBusca);
      const res = criarRes();

      await buscasRecentesController.salvar({ body }, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(novaBusca);
    });

    it('responde 400 com a mensagem do erro quando o registro é recusado', async () => {
      buscasRecentesService.registrarBusca.mockRejectedValue(
        new Error('Origem e destino são obrigatórios.')
      );
      const res = criarRes();

      await buscasRecentesController.salvar({ body }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ erro: 'Origem e destino são obrigatórios.' });
    });
  });

  describe('listar', () => {
    it('repassa usuário e limite da query ao serviço', async () => {
      buscasRecentesService.obterBuscasRecentes.mockResolvedValue([]);

      await buscasRecentesController.listar({ query: { usuarioId: '1', limite: '5' } }, criarRes());

      expect(buscasRecentesService.obterBuscasRecentes).toHaveBeenCalledWith('1', '5');
    });

    it('chama o serviço sem limite quando a query não informa', async () => {
      buscasRecentesService.obterBuscasRecentes.mockResolvedValue([]);

      await buscasRecentesController.listar({ query: { usuarioId: '1' } }, criarRes());

      expect(buscasRecentesService.obterBuscasRecentes).toHaveBeenCalledWith('1', undefined);
    });

    it('responde 200 com as buscas recentes', async () => {
      const buscas = [
        { id: 1, origem: 'Asa Sul', destino: 'Rodoviária' },
        { id: 2, origem: 'Taguatinga', destino: 'Aeroporto' },
      ];
      buscasRecentesService.obterBuscasRecentes.mockResolvedValue(buscas);
      const res = criarRes();

      await buscasRecentesController.listar({ query: { usuarioId: '1' } }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(buscas);
    });

    it('responde 500 com mensagem genérica quando o serviço falha', async () => {
      buscasRecentesService.obterBuscasRecentes.mockRejectedValue(new Error('falha no banco'));
      const res = criarRes();

      await buscasRecentesController.listar({ query: { usuarioId: '1' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'Erro interno ao consultar buscas recentes.',
      });
    });
  });
});
