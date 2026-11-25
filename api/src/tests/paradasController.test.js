const paradasService = require('../services/paradasService');
const alertasService = require('../services/alertasService');
const paradasController = require('../controllers/paradasController');

jest.mock('../services/paradasService', () => ({
  buscarParadas: jest.fn(),
  obterParadaMaisProxima: jest.fn(),
  obterProximasPartidas: jest.fn(),
}));

jest.mock('../services/alertasService', () => ({
  vigentesPara: jest.fn(),
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
    alertasService.vigentesPara.mockResolvedValue([]);
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('buscarParadas', () => {
    it('repassa busca e limite ao serviço e responde 200 com as paradas', async () => {
      const paradas = [{ id: '3369', nome: 'PLATAFORMA SUPERIOR DA RODOVIARIA' }];
      paradasService.buscarParadas.mockResolvedValue(paradas);
      const res = criarRes();

      await paradasController.buscarParadas({ query: { busca: 'Rodoviária', limite: '5' } }, res);

      expect(paradasService.buscarParadas).toHaveBeenCalledWith('Rodoviária', '5');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(paradas);
    });

    it('responde 500 quando ocorre erro ao buscar paradas', async () => {
      const erro = new Error('falha no banco');
      paradasService.buscarParadas.mockRejectedValue(erro);
      const res = criarRes();

      await paradasController.buscarParadas({ query: { busca: 'UnB' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar paradas.',
      });
      expect(erroSpy).toHaveBeenCalledWith('Erro ao buscar paradas:', erro);
    });
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

    it('repassa lat e lng ao serviço e responde 200 com a parada e alertas (RF14)', async () => {
      const parada = { id: 10, nome: 'Asa Sul - Quadra 704' };
      const alerta = { id: 3, tipo: 'SUSPENSAO', descricao: 'Parada em manutenção' };
      paradasService.obterParadaMaisProxima.mockResolvedValue(parada);
      alertasService.vigentesPara.mockResolvedValue([alerta]);
      const res = criarRes();

      await paradasController.getParadaProxima({ query: { lat: '-15.79', lng: '-47.88' } }, res);

      expect(paradasService.obterParadaMaisProxima).toHaveBeenCalledWith('-15.79', '-47.88');
      expect(alertasService.vigentesPara).toHaveBeenCalledWith([], [10, undefined]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...parada,
        afetadaPorAlerta: true,
        alertas: [alerta],
      });
    });

    it('continua respondendo 200 sem alertas se a consulta de alertas falhar', async () => {
      const parada = { id: 10, nome: 'Asa Sul - Quadra 704' };
      paradasService.obterParadaMaisProxima.mockResolvedValue(parada);
      alertasService.vigentesPara.mockRejectedValue(new Error('erro alertas'));
      const res = criarRes();

      await paradasController.getParadaProxima({ query: { lat: '-15.79', lng: '-47.88' } }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...parada,
        afetadaPorAlerta: false,
        alertas: [],
      });
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

  describe('getProximasPartidas (RF11)', () => {
    const dadosPartidas = {
      parada: { id: '3369', codigo: 'P-101', nome: 'Rodoviária do Plano Piloto' },
      tipoDia: 'DIA_UTIL',
      horarioReferencia: '14:10',
      partidas: [
        { linhaId: 'L1', linhaCodigo: '0.111', linhaNome: 'Asa Sul', sentido: 'IDA', horario: '14:15', minutosRestantes: 5 },
      ],
      mensagem: null,
    };

    it('responde 400 quando o id da parada não é informado', async () => {
      const res = criarRes();

      await paradasController.getProximasPartidas({ params: { id: '   ' }, query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(paradasService.obterProximasPartidas).not.toHaveBeenCalled();
    });

    it('responde 200 com as próximas partidas e alertas vigentes da parada', async () => {
      const alerta = { id: 7, tipo: 'DESVIO', descricao: 'Desvio temporário' };
      paradasService.obterProximasPartidas.mockResolvedValue(dadosPartidas);
      alertasService.vigentesPara.mockResolvedValue([alerta]);
      const res = criarRes();

      await paradasController.getProximasPartidas(
        { params: { id: '3369' }, query: { horario: '14:10', tipoDia: 'DIA_UTIL', limite: '20' } },
        res
      );

      expect(paradasService.obterProximasPartidas).toHaveBeenCalledWith('3369', {
        horario: '14:10',
        tipoDia: 'DIA_UTIL',
        limite: '20',
      });
      expect(alertasService.vigentesPara).toHaveBeenCalledWith([], ['3369', 'P-101']);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...dadosPartidas,
        afetadaPorAlerta: true,
        alertas: [alerta],
      });
    });

    it('continua respondendo 200 sem alertas se a consulta de alertas falhar', async () => {
      paradasService.obterProximasPartidas.mockResolvedValue(dadosPartidas);
      alertasService.vigentesPara.mockRejectedValue(new Error('erro alertas'));
      const res = criarRes();

      await paradasController.getProximasPartidas({ params: { id: '3369' }, query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...dadosPartidas,
        afetadaPorAlerta: false,
        alertas: [],
      });
    });

    it('responde 404 quando a parada não existe', async () => {
      paradasService.obterProximasPartidas.mockResolvedValue(null);
      const res = criarRes();

      await paradasController.getProximasPartidas({ params: { id: '9999' }, query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'NOT_FOUND',
        detalhes: 'Parada não encontrada.',
      });
    });

    it('responde 400 quando o serviço rejeita parâmetros inválidos', async () => {
      const erroValidacao = new Error('O parâmetro horario deve estar no formato HH:MM.');
      erroValidacao.status = 400;
      erroValidacao.erro = 'BAD_REQUEST';
      erroValidacao.detalhes = erroValidacao.message;
      paradasService.obterProximasPartidas.mockRejectedValue(erroValidacao);
      const res = criarRes();

      await paradasController.getProximasPartidas(
        { params: { id: '3369' }, query: { horario: '99:99' } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'O parâmetro horario deve estar no formato HH:MM.',
      });
    });

    it('responde 500 quando ocorre erro inesperado no serviço', async () => {
      const erro = new Error('falha no banco');
      paradasService.obterProximasPartidas.mockRejectedValue(erro);
      const res = criarRes();

      await paradasController.getProximasPartidas({ params: { id: '3369' }, query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar próximas partidas da parada.',
      });
    });
  });
});
