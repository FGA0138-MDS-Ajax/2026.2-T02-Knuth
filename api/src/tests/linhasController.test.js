const linhasService = require('../src/services/linhasService');
const linhasController = require('../src/controllers/linhasController');

jest.mock('../src/services/linhasService', () => ({
  obterLinhas: jest.fn(),
  obterItinerario: jest.fn(),
  obterQuadroHorarios: jest.fn(),
}));

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// -----testes------
describe('LinhasController', () => {
  let erroSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('getLinhas', () => {
    it('responde 200 com as linhas devolvidas pelo serviço', async () => {
      const linhas = [{ id: 1, codigo: '0.111' }];
      linhasService.obterLinhas.mockResolvedValue(linhas);
      const res = criarRes();

      await linhasController.getLinhas({ query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(linhas);
    });

    it('repassa só o texto da busca quando não há outros filtros', async () => {
      linhasService.obterLinhas.mockResolvedValue([]);

      await linhasController.getLinhas({ query: { busca: 'asa' } }, criarRes());

      expect(linhasService.obterLinhas).toHaveBeenCalledWith('asa');
    });

    it('chama o serviço com undefined quando não há nenhum parâmetro', async () => {
      linhasService.obterLinhas.mockResolvedValue([]);

      await linhasController.getLinhas({ query: {} }, criarRes());

      expect(linhasService.obterLinhas).toHaveBeenCalledWith(undefined);
    });

    it('funciona quando a requisição não tem query', async () => {
      linhasService.obterLinhas.mockResolvedValue([]);
      const res = criarRes();

      await linhasController.getLinhas({}, res);

      expect(linhasService.obterLinhas).toHaveBeenCalledWith(undefined);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it.each([
      [{ bacia: 'Paranoá' }],
      [{ regiao: 'Plano Piloto' }],
      [{ tipo: 'CONVENCIONAL' }],
      [{ busca: 'asa', bacia: 'Paranoá', regiao: 'Plano Piloto', tipo: 'CONVENCIONAL' }],
    ])('repassa todos os filtros em um objeto quando a consulta é %j', async (query) => {
      linhasService.obterLinhas.mockResolvedValue([]);

      await linhasController.getLinhas({ query }, criarRes());

      expect(linhasService.obterLinhas).toHaveBeenCalledWith({
        busca: query.busca,
        bacia: query.bacia,
        regiao: query.regiao,
        tipo: query.tipo,
      });
    });

    it('responde 500 e registra o erro quando o serviço falha', async () => {
      const erro = new Error('falha no banco');
      linhasService.obterLinhas.mockRejectedValue(erro);
      const res = criarRes();

      await linhasController.getLinhas({ query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar linhas.',
      });
      expect(erroSpy).toHaveBeenCalledWith('Erro na busca de linhas:', erro);
    });
  });

  describe('getItinerario', () => {
    it.each([[undefined], [''], ['   '], ['abc'], ['12a'], ['1;2']])(
      'responde 400 quando o id é inválido (%j)',
      async (id) => {
        const res = criarRes();

        await linhasController.getItinerario({ params: { id } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          erro: 'BAD_REQUEST',
          detalhes: 'O ID da linha é obrigatório.',
        });
        expect(linhasService.obterItinerario).not.toHaveBeenCalled();
      }
    );

    it('responde 400 quando a requisição não tem params', async () => {
      const res = criarRes();

      await linhasController.getItinerario({}, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it.each([['12'], ['0.111']])('aceita o id %s e responde 200 com o itinerário', async (id) => {
      const itinerario = { codigo: id, itinerario: { IDA: [], VOLTA: [] } };
      linhasService.obterItinerario.mockResolvedValue(itinerario);
      const res = criarRes();

      await linhasController.getItinerario({ params: { id } }, res);

      expect(linhasService.obterItinerario).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(itinerario);
    });

    it('responde 404 quando a linha não tem itinerário', async () => {
      linhasService.obterItinerario.mockResolvedValue(null);
      const res = criarRes();

      await linhasController.getItinerario({ params: { id: '99' } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'NOT_FOUND',
        detalhes: 'Itinerário não encontrado para a linha informada.',
      });
    });

    it('responde 500 e registra o erro quando o serviço falha', async () => {
      const erro = new Error('falha no banco');
      linhasService.obterItinerario.mockRejectedValue(erro);
      const res = criarRes();

      await linhasController.getItinerario({ params: { id: '12' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao consultar o itinerário.',
      });
      expect(erroSpy).toHaveBeenCalledWith('Erro na consulta do itinerario:', erro);
    });
  });

  describe('getHorarios', () => {
    it.each([[undefined], [''], ['   ']])('responde 400 quando o id é vazio (%j)', async (id) => {
      const res = criarRes();

      await linhasController.getHorarios({ params: { id } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'O ID da linha é obrigatório.',
      });
      expect(linhasService.obterQuadroHorarios).not.toHaveBeenCalled();
    });

    it('responde 400 quando a requisição não tem params', async () => {
      const res = criarRes();

      await linhasController.getHorarios({}, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 200 com o quadro de horários da linha', async () => {
      const quadro = { codigo: '0.111', quadroHorarios: { IDA: {}, VOLTA: {} } };
      linhasService.obterQuadroHorarios.mockResolvedValue(quadro);
      const res = criarRes();

      await linhasController.getHorarios({ params: { id: '12' } }, res);

      expect(linhasService.obterQuadroHorarios).toHaveBeenCalledWith('12');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(quadro);
    });

    it('responde 404 quando a linha não tem quadro de horários', async () => {
      linhasService.obterQuadroHorarios.mockResolvedValue(null);
      const res = criarRes();

      await linhasController.getHorarios({ params: { id: '99' } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'NOT_FOUND',
        detalhes: 'Quadro de horários não encontrado para a linha informada.',
      });
    });

    it('responde 500 e registra o erro quando o serviço falha', async () => {
      const erro = new Error('falha no banco');
      linhasService.obterQuadroHorarios.mockRejectedValue(erro);
      const res = criarRes();

      await linhasController.getHorarios({ params: { id: '12' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao consultar o quadro de horários.',
      });
      expect(erroSpy).toHaveBeenCalledWith('Erro na consulta de horarios:', erro);
    });
  });
});
