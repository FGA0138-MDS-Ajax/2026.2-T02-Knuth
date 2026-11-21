const reportesDivergenciaRepository = require('../repositories/reportesDivergenciaRepository');
const reportesDivergenciaService = require('../services/reportesDivergenciaService');

jest.mock('../repositories/reportesDivergenciaRepository', () => ({
  criar: jest.fn(),
}));

describe('ReportesDivergenciaService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('normaliza os dados e cria o reporte com sucesso', async () => {
    const salvo = { id: 10, tipo: 'ITINERARIO', status: 'PENDENTE' };
    reportesDivergenciaRepository.criar.mockResolvedValue(salvo);

    const resultado = await reportesDivergenciaService.registrarReporte({
      tipo: ' itinerario ',
      descricao: '  A linha desviou da quadra 302 Sul sem aviso.  ',
      linhaId: ' 0.110 ',
      paradaId: '',
      usuarioId: '5',
    });

    expect(reportesDivergenciaRepository.criar).toHaveBeenCalledWith({
      tipo: 'ITINERARIO',
      descricao: 'A linha desviou da quadra 302 Sul sem aviso.',
      linhaId: '0.110',
      paradaId: null,
      usuarioId: 5,
    });
    expect(resultado).toEqual(salvo);
  });

  it.each([undefined, '', 'INVALIDO'])('rejeita tipo de divergência inválido (%s)', async (tipo) => {
    await expect(
      reportesDivergenciaService.registrarReporte({
        tipo,
        descricao: 'Descrição válida com mais de dez caracteres.',
        linhaId: '0.110',
      })
    ).rejects.toThrow('Tipo de divergência inválido. Use: HORARIO, PARADA ou ITINERARIO.');

    expect(reportesDivergenciaRepository.criar).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'curta', '   123456789   '])(
    'rejeita descrição ausente ou com menos de 10 caracteres (%s)',
    async (descricao) => {
      await expect(
        reportesDivergenciaService.registrarReporte({
          tipo: 'HORARIO',
          descricao,
          linhaId: '0.110',
        })
      ).rejects.toThrow('A descrição da divergência deve ter pelo menos 10 caracteres.');

      expect(reportesDivergenciaRepository.criar).not.toHaveBeenCalled();
    }
  );

  it('rejeita quando nem linhaId nem paradaId são informados', async () => {
    await expect(
      reportesDivergenciaService.registrarReporte({
        tipo: 'PARADA',
        descricao: 'Placa da parada está danificada e ilegível.',
      })
    ).rejects.toThrow('Informe ao menos a linha ou a parada relacionada à divergência.');

    expect(reportesDivergenciaRepository.criar).not.toHaveBeenCalled();
  });
});