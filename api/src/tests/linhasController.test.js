const linhasService = require('../services/linhasService');
const alertasService = require('../services/alertasService');
const linhasController = require('../controllers/linhasController');

jest.mock('../services/linhasService', () => ({
  obterLinhas: jest.fn(),
  obterItinerario: jest.fn(),
  obterQuadroHorarios: jest.fn(),
}));

jest.mock('../services/alertasService', () => ({
  listarAlertasVigentes: jest.fn(),
  vigentesPara: jest.fn(),
  filtrarAlertasParaItens: jest.fn(),
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
    alertasService.listarAlertasVigentes.mockResolvedValue([]);
    alertasService.vigentesPara.mockResolvedValue([]);
    alertasService.filtrarAlertasParaItens.mockReturnValue([]);
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('getLinhas', () => {
    it('responde 200 com as linhas devolvidas pelo serviço e sinalização de alertas (RF14)', async () => {
      const linhas = [{ id: 1, codigo: '0.111' }];
      const alerta = { id: 10, tipo: 'DESVIO', descricao: 'Desvio na W3' };
      linhasService.obterLinhas.mockResolvedValue(linhas);
      alertasService.listarAlertasVigentes.mockResolvedValue([alerta]);
      alertasService.filtrarAlertasParaItens.mockReturnValue([alerta]);
      const res = criarRes();

      await linhasController.getLinhas({ query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { id: 1, codigo: '0.111', afetadaPorAlerta: true, alertas: [alerta] },
      ]);
    });

    it('mantém a resposta 200 mesmo se a consulta de alertas falhar', async () => {
      const linhas = [{ id: 1, codigo: '0.111' }];
      linhasService.obterLinhas.mockResolvedValue(linhas);
      alertasService.listarAlertasVigentes.mockRejectedValue(new Error('erro alertas'));
      const res = criarRes();

      await linhasController.getLinhas({ query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { id: 1, codigo: '0.111', afetadaPorAlerta: false, alertas: [] },
      ]);
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

    it.each([['12'], ['0.111']])('aceita o id %s e responde 200 com o itinerário e alertas', async (id) => {
      const itinerario = { codigo: id, itinerario: { IDA: [], VOLTA: [] } };
      linhasService.obterItinerario.mockResolvedValue(itinerario);
      const res = criarRes();

      await linhasController.getItinerario({ params: { id } }, res);

      expect(linhasService.obterItinerario).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...itinerario,
        afetadaPorAlerta: false,
        alertas: [],
      });
    });

    it('sinaliza alertas na linha e nas paradas afetadas do itinerário (RF14)', async () => {
      const alertaLinha = { id: 1, tipo: 'DESVIO', descricao: 'Desvio na linha' };
      const alertaParada = { id: 2, tipo: 'SUSPENSAO', descricao: 'Parada interditada' };
      const itinerario = {
        codigo: '0.111',
        itinerario: {
          IDA: [{ sequencia: 1, paradaId: '10', codigo: 'P-10', nome: 'Rodoviária' }],
          VOLTA: [],
        },
      };
      linhasService.obterItinerario.mockResolvedValue(itinerario);
      alertasService.vigentesPara.mockResolvedValue([alertaLinha, alertaParada]);
      alertasService.filtrarAlertasParaItens
        .mockReturnValueOnce([alertaLinha])
        .mockReturnValueOnce([alertaParada]);
      const res = criarRes();

      await linhasController.getItinerario({ params: { id: '0.111' } }, res);

      expect(alertasService.vigentesPara).toHaveBeenCalledWith(['0.111', '0.111'], ['10', 'P-10']);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        codigo: '0.111',
        afetadaPorAlerta: true,
        alertas: [alertaLinha],
        itinerario: {
          IDA: [
            {
              sequencia: 1,
              paradaId: '10',
              codigo: 'P-10',
              nome: 'Rodoviária',
              afetadaPorAlerta: true,
              alertas: [alertaParada],
            },
          ],
          VOLTA: [],
        },
      });
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

    it('responde 200 com o quadro de horários e alertas vigentes da linha (RF14)', async () => {
      const quadro = { codigo: '0.111', quadroHorarios: { IDA: {}, VOLTA: {} } };
      const alerta = { id: 5, tipo: 'ALTERACAO_HORARIO', descricao: 'Intervalo reduzido' };
      linhasService.obterQuadroHorarios.mockResolvedValue(quadro);
      alertasService.vigentesPara.mockResolvedValue([alerta]);
      const res = criarRes();

      await linhasController.getHorarios({ params: { id: '12' } }, res);

      expect(linhasService.obterQuadroHorarios).toHaveBeenCalledWith('12');
      expect(alertasService.vigentesPara).toHaveBeenCalledWith(['12', '0.111'], []);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...quadro,
        afetadaPorAlerta: true,
        alertas: [alerta],
      });
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
