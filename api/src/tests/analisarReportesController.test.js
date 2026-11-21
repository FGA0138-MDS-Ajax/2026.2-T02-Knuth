jest.mock('../services/analisarReportesService', () => ({
  listar: jest.fn(),
  obterPorId: jest.fn(),
  analisar: jest.fn(),
}));

const service = require('../services/analisarReportesService');
const controller = require('../controllers/analisarReportesController');
const { criarRes } = require('./rotas');

// -----testes------
describe('AnalisarReportesController', () => {
  let erroSpy;

  const erroComStatus = (mensagem, status) => Object.assign(new Error(mensagem), { status });

  beforeEach(() => {
    jest.resetAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('listar', () => {
    it('repassa filtros da query e responde 200 com a lista', async () => {
      const lista = [{ id: 1, status: 'PENDENTE' }];
      service.listar.mockResolvedValue(lista);
      const res = criarRes();

      await controller.listar({ query: { status: 'PENDENTE', tipo: 'HORARIO' } }, res);

      expect(service.listar).toHaveBeenCalledWith({ status: 'PENDENTE', tipo: 'HORARIO' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(lista);
    });

    it('responde 400 quando o filtro é inválido', async () => {
      service.listar.mockRejectedValue(erroComStatus('Status inválido.', 400));
      const res = criarRes();

      await controller.listar({ query: { status: 'INVALIDO' } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ erro: 'BAD_REQUEST', detalhes: 'Status inválido.' });
    });

    it('responde 500 em erro inesperado', async () => {
      service.listar.mockRejectedValue(new Error('falha no banco'));
      const res = criarRes();

      await controller.listar({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao listar os reportes.',
      });
    });
  });

  describe('obterPorId', () => {
    it('responde 200 com o reporte encontrado', async () => {
      const reporte = { id: 3, tipo: 'PARADA' };
      service.obterPorId.mockResolvedValue(reporte);
      const res = criarRes();

      await controller.obterPorId({ params: { id: '3' } }, res);

      expect(service.obterPorId).toHaveBeenCalledWith('3');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(reporte);
    });

    it('responde 404 quando o reporte não existe', async () => {
      service.obterPorId.mockRejectedValue(erroComStatus('Reporte não encontrado.', 404));
      const res = criarRes();

      await controller.obterPorId({ params: { id: '99' } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ erro: 'NOT_FOUND', detalhes: 'Reporte não encontrado.' });
    });

    it('responde 500 em erro inesperado', async () => {
      service.obterPorId.mockRejectedValue(new Error('erro db'));
      const res = criarRes();

      await controller.obterPorId({ params: { id: '3' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao consultar o reporte.',
      });
    });
  });

  describe('analisar', () => {
    it('repassa id e dados do corpo e responde 200', async () => {
      const atualizado = { id: 3, status: 'PROCEDENTE', observacaoAdmin: 'Ajustado.' };
      service.analisar.mockResolvedValue(atualizado);
      const res = criarRes();

      await controller.analisar(
        { params: { id: '3' }, body: { status: 'PROCEDENTE', observacaoAdmin: 'Ajustado.' } },
        res
      );

      expect(service.analisar).toHaveBeenCalledWith('3', {
        status: 'PROCEDENTE',
        observacaoAdmin: 'Ajustado.',
        correcaoRealizada: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(atualizado);
    });

    it('responde 400 quando falta correção para reporte procedente', async () => {
      service.analisar.mockRejectedValue(
        erroComStatus('Informe a correção realizada ao classificar o reporte como procedente.', 400)
      );
      const res = criarRes();

      await controller.analisar({ params: { id: '3' }, body: { status: 'PROCEDENTE' } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'Informe a correção realizada ao classificar o reporte como procedente.',
      });
    });

    it('responde 404 quando o reporte não existe', async () => {
      service.analisar.mockRejectedValue(erroComStatus('Reporte não encontrado.', 404));
      const res = criarRes();

      await controller.analisar({ params: { id: '99' }, body: { status: 'IMPROCEDENTE' } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ erro: 'NOT_FOUND', detalhes: 'Reporte não encontrado.' });
    });

    it('responde 500 em erro inesperado', async () => {
      service.analisar.mockRejectedValue(new Error('erro db'));
      const res = criarRes();

      await controller.analisar({ params: { id: '3' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao atualizar a análise do reporte.',
      });
    });
  });
});
