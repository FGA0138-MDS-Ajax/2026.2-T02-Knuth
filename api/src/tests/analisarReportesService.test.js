jest.mock('../repositories/analisarReportesRepository', () => ({
  listar: jest.fn(),
  buscarPorId: jest.fn(),
  atualizarAnalise: jest.fn(),
}));

const repo = require('../repositories/analisarReportesRepository');
const service = require('../services/analisarReportesService');

// -----testes------
describe('AnalisarReportesService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listar', () => {
    it('lista sem filtros quando nenhum parâmetro é informado', async () => {
      const lista = [{ id: 1, status: 'PENDENTE' }];
      repo.listar.mockResolvedValue(lista);

      const resultado = await service.listar();

      expect(repo.listar).toHaveBeenCalledWith({ status: undefined, tipo: undefined });
      expect(resultado).toEqual(lista);
    });

    it('normaliza status e tipo para maiúsculas antes de consultar', async () => {
      repo.listar.mockResolvedValue([]);

      await service.listar({ status: ' pendente ', tipo: ' horario ' });

      expect(repo.listar).toHaveBeenCalledWith({ status: 'PENDENTE', tipo: 'HORARIO' });
    });

    it('rejeita filtro de status inválido com erro 400', async () => {
      await expect(service.listar({ status: 'APROVADO' })).rejects.toMatchObject({
        message: 'Status inválido. Use: PENDENTE, PROCEDENTE ou IMPROCEDENTE.',
        status: 400,
      });
      expect(repo.listar).not.toHaveBeenCalled();
    });

    it('rejeita filtro de tipo inválido com erro 400', async () => {
      await expect(service.listar({ tipo: 'TARIFA' })).rejects.toMatchObject({
        message: 'Tipo de divergência inválido. Use: HORARIO, PARADA ou ITINERARIO.',
        status: 400,
      });
      expect(repo.listar).not.toHaveBeenCalled();
    });
  });

  describe('obterPorId', () => {
    it.each(['abc', '0', '-5', '1.5'])('rejeita ID inválido (%s) com 400', async (idInvalido) => {
      await expect(service.obterPorId(idInvalido)).rejects.toMatchObject({
        message: 'ID do reporte inválido.',
        status: 400,
      });
      expect(repo.buscarPorId).not.toHaveBeenCalled();
    });

    it('responde 404 quando o reporte não existe', async () => {
      repo.buscarPorId.mockResolvedValue(null);

      await expect(service.obterPorId('42')).rejects.toMatchObject({
        message: 'Reporte não encontrado.',
        status: 404,
      });
    });

    it('retorna o reporte encontrado', async () => {
      const reporte = { id: 10, tipo: 'PARADA', status: 'PENDENTE' };
      repo.buscarPorId.mockResolvedValue(reporte);

      const resultado = await service.obterPorId('10');

      expect(repo.buscarPorId).toHaveBeenCalledWith(10);
      expect(resultado).toEqual(reporte);
    });
  });

  describe('analisar', () => {
    const EXISTENTE = { id: 5, tipo: 'HORARIO', status: 'PENDENTE' };

    it('rejeita ID inválido com 400', async () => {
      await expect(service.analisar('x', { status: 'IMPROCEDENTE' })).rejects.toMatchObject({
        message: 'ID do reporte inválido.',
        status: 400,
      });
    });

    it('rejeita status ausente ou inválido com 400', async () => {
      await expect(service.analisar(5, { status: '' })).rejects.toMatchObject({
        message: 'Status inválido. Use: PENDENTE, PROCEDENTE ou IMPROCEDENTE.',
        status: 400,
      });
      await expect(service.analisar(5, { status: 'FECHADO' })).rejects.toMatchObject({
        message: 'Status inválido. Use: PENDENTE, PROCEDENTE ou IMPROCEDENTE.',
        status: 400,
      });
    });

    it('exige registro da correção realizada quando classificado como PROCEDENTE', async () => {
      await expect(
        service.analisar(5, { status: 'procedente', observacaoAdmin: '   ' })
      ).rejects.toMatchObject({
        message: 'Informe a correção realizada ao classificar o reporte como procedente.',
        status: 400,
      });
      expect(repo.atualizarAnalise).not.toHaveBeenCalled();
    });

    it('responde 404 quando o reporte não existe', async () => {
      repo.buscarPorId.mockResolvedValue(null);

      await expect(
        service.analisar(99, { status: 'IMPROCEDENTE', observacaoAdmin: 'Horário já confere.' })
      ).rejects.toMatchObject({
        message: 'Reporte não encontrado.',
        status: 404,
      });
      expect(repo.atualizarAnalise).not.toHaveBeenCalled();
    });

    it('classifica como PROCEDENTE e registra a correção realizada', async () => {
      const atualizado = {
        ...EXISTENTE,
        status: 'PROCEDENTE',
        observacaoAdmin: 'Horário das 07:30 adicionado.',
      };
      repo.buscarPorId.mockResolvedValue(EXISTENTE);
      repo.atualizarAnalise.mockResolvedValue(atualizado);

      const resultado = await service.analisar('5', {
        status: 'procedente',
        observacaoAdmin: '  Horário das 07:30 adicionado.  ',
      });

      expect(repo.atualizarAnalise).toHaveBeenCalledWith(
        5,
        'PROCEDENTE',
        'Horário das 07:30 adicionado.'
      );
      expect(resultado).toEqual(atualizado);
    });

    it('aceita o campo correcaoRealizada como alternativa a observacaoAdmin', async () => {
      repo.buscarPorId.mockResolvedValue(EXISTENTE);
      repo.atualizarAnalise.mockResolvedValue({ ...EXISTENTE, status: 'PROCEDENTE' });

      await service.analisar(5, {
        status: 'PROCEDENTE',
        correcaoRealizada: 'Parada corrigida no itinerário.',
      });

      expect(repo.atualizarAnalise).toHaveBeenCalledWith(
        5,
        'PROCEDENTE',
        'Parada corrigida no itinerário.'
      );
    });

    it('permite classificar como IMPROCEDENTE ou PENDENTE sem observação obrigatória', async () => {
      repo.buscarPorId.mockResolvedValue(EXISTENTE);
      repo.atualizarAnalise.mockResolvedValue({ ...EXISTENTE, status: 'IMPROCEDENTE', observacaoAdmin: null });

      await service.analisar(5, { status: 'IMPROCEDENTE' });
      expect(repo.atualizarAnalise).toHaveBeenCalledWith(5, 'IMPROCEDENTE', null);

      await service.analisar(5, { status: 'PENDENTE', observacaoAdmin: '' });
      expect(repo.atualizarAnalise).toHaveBeenCalledWith(5, 'PENDENTE', null);
    });
  });
});
