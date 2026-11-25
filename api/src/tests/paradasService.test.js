jest.mock('../repositories/paradasRepository', () => ({
  findNearestParada: jest.fn(),
  buscarPorNome: jest.fn(),
  findById: jest.fn(),
  findProximasPartidas: jest.fn(),
}));

const paradasRepository = require('../repositories/paradasRepository');
const paradasService = require('../services/paradasService');

describe('ParadasService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('obterParadaMaisProxima', () => {
    it('repassa latitude e longitude ao repositório e retorna a parada', async () => {
      const parada = { id: 3, nome: 'Terminal Central', distancia: 120 };
      paradasRepository.findNearestParada.mockResolvedValue(parada);

      const resultado = await paradasService.obterParadaMaisProxima(-10.184, -48.333);

      expect(paradasRepository.findNearestParada).toHaveBeenCalledWith(-10.184, -48.333);
      expect(resultado).toBe(parada);
    });

    it('retorna null quando nenhuma parada é encontrada', async () => {
      paradasRepository.findNearestParada.mockResolvedValue(null);

      await expect(paradasService.obterParadaMaisProxima(0, 0)).resolves.toBeNull();
    });

    it('propaga o erro do repositório', async () => {
      paradasRepository.findNearestParada.mockRejectedValue(new Error('falha no banco'));

      await expect(paradasService.obterParadaMaisProxima(1, 1)).rejects.toThrow('falha no banco');
    });
  });

  describe('buscarParadas', () => {
    it('retorna lista vazia para termos com menos de 2 caracteres', async () => {
      await expect(paradasService.buscarParadas('a')).resolves.toEqual([]);
      await expect(paradasService.buscarParadas('  ')).resolves.toEqual([]);
      expect(paradasRepository.buscarPorNome).not.toHaveBeenCalled();
    });

    it('repassa o termo aparado e o limite válido ao repositório', async () => {
      const paradas = [{ id: '1', nome: 'UNB' }];
      paradasRepository.buscarPorNome.mockResolvedValue(paradas);

      const resultado = await paradasService.buscarParadas('  UnB  ', '8');

      expect(paradasRepository.buscarPorNome).toHaveBeenCalledWith('UnB', 8);
      expect(resultado).toEqual(paradas);
    });
  });

  describe('obterProximasPartidas (RF11)', () => {
    const paradaBase = {
      id: '3369',
      codigo: 'P-101',
      nome: 'Rodoviária do Plano Piloto',
      latitude: '-15.793889',
      longitude: '-47.882778',
    };

    it('retorna as próximas partidas formatadas em ordem cronológica com minutos restantes', async () => {
      paradasRepository.findById.mockResolvedValue(paradaBase);
      paradasRepository.findProximasPartidas.mockResolvedValue([
        {
          linha_id: 'L1',
          linha_codigo: '0.111',
          linha_nome: 'Rodoviária / Asa Sul',
          linha_cor: '#006666',
          sentido: 'IDA',
          destino: 'Asa Sul',
          horario_partida: '14:15',
        },
        {
          linha_id: 'L2',
          linha_codigo: '0.116',
          linha_nome: 'Rodoviária / UnB',
          linha_cor: null,
          sentido: 'VOLTA',
          destino: null,
          horario_partida: '14:40',
        },
      ]);

      const resultado = await paradasService.obterProximasPartidas('3369', {
        horario: '14:10',
        tipoDia: 'DIA_UTIL',
        limite: '15',
      });

      expect(paradasRepository.findById).toHaveBeenCalledWith('3369');
      expect(paradasRepository.findProximasPartidas).toHaveBeenCalledWith(
        '3369',
        'DIA_UTIL',
        '14:10',
        15
      );
      expect(resultado).toEqual({
        parada: {
          id: '3369',
          codigo: 'P-101',
          nome: 'Rodoviária do Plano Piloto',
          latitude: -15.793889,
          longitude: -47.882778,
        },
        tipoDia: 'DIA_UTIL',
        horarioReferencia: '14:10',
        mensagem: null,
        partidas: [
          {
            linhaId: 'L1',
            linhaCodigo: '0.111',
            linhaNome: 'Rodoviária / Asa Sul',
            linhaCor: '#006666',
            sentido: 'IDA',
            destino: 'Asa Sul',
            horario: '14:15',
            minutosRestantes: 5,
          },
          {
            linhaId: 'L2',
            linhaCodigo: '0.116',
            linhaNome: 'Rodoviária / UnB',
            linhaCor: null,
            sentido: 'VOLTA',
            destino: null,
            horario: '14:40',
            minutosRestantes: 30,
          },
        ],
      });
    });

    it('retorna mensagem explícita quando não há mais partidas previstas para o dia', async () => {
      paradasRepository.findById.mockResolvedValue(paradaBase);
      paradasRepository.findProximasPartidas.mockResolvedValue([]);

      const resultado = await paradasService.obterProximasPartidas('3369', {
        horario: '23:55',
        tipoDia: 'SABADO',
      });

      expect(resultado.partidas).toEqual([]);
      expect(resultado.mensagem).toBe('Não há mais partidas previstas para hoje nesta parada.');
    });

    it('detecta automaticamente horário e tipo de dia no fuso de Brasília', async () => {
      paradasRepository.findById.mockResolvedValue(paradaBase);
      paradasRepository.findProximasPartidas.mockResolvedValue([]);

      // 2026-11-22 é domingo; 15:30 UTC = 12:30 em Brasília (-03:00)
      const domingo = new Date('2026-11-22T15:30:00.000Z');
      const resultado = await paradasService.obterProximasPartidas('3369', { agora: domingo });

      expect(paradasRepository.findProximasPartidas).toHaveBeenCalledWith(
        '3369',
        'DOMINGO_FERIADO',
        '12:30',
        30
      );
      expect(resultado.tipoDia).toBe('DOMINGO_FERIADO');
      expect(resultado.horarioReferencia).toBe('12:30');
    });

    it('retorna null quando a parada não é encontrada', async () => {
      paradasRepository.findById.mockResolvedValue(null);

      await expect(
        paradasService.obterProximasPartidas('inexistente', { horario: '10:00', tipoDia: 'DIA_UTIL' })
      ).resolves.toBeNull();
      expect(paradasRepository.findProximasPartidas).not.toHaveBeenCalled();
    });

    it('lança erro 400 para horário inválido, tipoDia inválido ou id vazio', async () => {
      await expect(paradasService.obterProximasPartidas('')).rejects.toMatchObject({ status: 400 });
      await expect(
        paradasService.obterProximasPartidas('3369', { horario: '25:99' })
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        paradasService.obterProximasPartidas('3369', { tipoDia: 'FERIADAO' })
      ).rejects.toMatchObject({ status: 400 });
    });
  });
});
