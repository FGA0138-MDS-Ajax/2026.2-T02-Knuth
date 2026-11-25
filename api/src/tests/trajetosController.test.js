const trajetosService = require('../services/trajetosService');
const alertasService = require('../services/alertasService');
const trajetosController = require('../controllers/trajetosController');

jest.mock('../services/trajetosService', () => ({
  obterTrajetos: jest.fn(),
}));

jest.mock('../services/alertasService', () => ({
  listarAlertasVigentes: jest.fn(),
  extrairItensDoTrajeto: jest.fn(),
  filtrarAlertasParaItens: jest.fn(),
}));

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// -----testes------
describe('TrajetosController', () => {
  let erroSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    alertasService.listarAlertasVigentes.mockResolvedValue([]);
    alertasService.extrairItensDoTrajeto.mockReturnValue({
      linhasIds: [],
      paradasIds: [],
      paradasNomes: [],
    });
    alertasService.filtrarAlertasParaItens.mockReturnValue([]);
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('getTrajetos', () => {
    it.each([
      [{}],
      [{ origem: 'Asa Sul' }],
      [{ destino: 'Rodoviária' }],
      [{ origem: '', destino: '' }],
    ])('responde 400 quando faltam parâmetros (%j)', async (query) => {
      const res = criarRes();

      await trajetosController.getTrajetos({ query }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'Os parâmetros origem e destino são obrigatórios.',
      });
      expect(trajetosService.obterTrajetos).not.toHaveBeenCalled();
    });

    it('repassa origem e destino ao serviço e responde 200 com as opções e alertas (RF14)', async () => {
      const opcoes = [{ duracaoMinutos: 25, baldeacoes: 0 }];
      const alerta = { id: 1, tipo: 'DESVIO', descricao: 'Desvio na W3' };
      trajetosService.obterTrajetos.mockResolvedValue(opcoes);
      alertasService.listarAlertasVigentes.mockResolvedValue([alerta]);
      alertasService.filtrarAlertasParaItens.mockReturnValue([alerta]);
      const res = criarRes();

      await trajetosController.getTrajetos(
        { query: { origem: 'Asa Sul', destino: 'Rodoviária' } },
        res
      );

      expect(trajetosService.obterTrajetos).toHaveBeenCalledWith('Asa Sul', 'Rodoviária');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { duracaoMinutos: 25, baldeacoes: 0, afetadaPorAlerta: true, alertas: [alerta] },
      ]);
    });

    it('mantém a resposta 200 sem alertas quando a consulta de alertas falha', async () => {
      const opcoes = [{ duracaoMinutos: 25, baldeacoes: 0 }];
      trajetosService.obterTrajetos.mockResolvedValue(opcoes);
      alertasService.listarAlertasVigentes.mockRejectedValue(new Error('erro alertas'));
      const res = criarRes();

      await trajetosController.getTrajetos(
        { query: { origem: 'Asa Sul', destino: 'Rodoviária' } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { duracaoMinutos: 25, baldeacoes: 0, afetadaPorAlerta: false, alertas: [] },
      ]);
    });

    it('responde 200 com lista vazia quando não há rotas', async () => {
      trajetosService.obterTrajetos.mockResolvedValue([]);
      const res = criarRes();

      await trajetosController.getTrajetos(
        { query: { origem: 'Asa Sul', destino: 'Lugar Nenhum' } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('responde 500 e registra o erro quando o serviço falha', async () => {
      const erro = new Error('falha no cálculo');
      trajetosService.obterTrajetos.mockRejectedValue(erro);
      const res = criarRes();

      await trajetosController.getTrajetos(
        { query: { origem: 'Asa Sul', destino: 'Rodoviária' } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao calcular trajetos.',
      });
      expect(erroSpy).toHaveBeenCalledWith('Erro na busca de trajetos:', erro);
    });

    it('repassa ordenarPor normalizado ao serviço quando válido (RF05)', async () => {
      const opcoes = [{ duracaoMinutos: 20, baldeacoes: 0, caminhadaMetros: 0 }];
      trajetosService.obterTrajetos.mockResolvedValue(opcoes);
      const res = criarRes();

      await trajetosController.getTrajetos(
        { query: { origem: 'Asa Sul', destino: 'Rodoviária', ordenarPor: 'baldeacoes' } },
        res
      );

      expect(trajetosService.obterTrajetos).toHaveBeenCalledWith(
        'Asa Sul',
        'Rodoviária',
        'BALDEACOES'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('responde 400 quando ordenarPor é inválido (RF05)', async () => {
      const res = criarRes();

      await trajetosController.getTrajetos(
        { query: { origem: 'Asa Sul', destino: 'Rodoviária', ordenarPor: 'tarifa' } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'Parâmetro ordenarPor inválido. Use TEMPO, BALDEACOES ou CAMINHADA.',
      });
      expect(trajetosService.obterTrajetos).not.toHaveBeenCalled();
    });
  });
});
