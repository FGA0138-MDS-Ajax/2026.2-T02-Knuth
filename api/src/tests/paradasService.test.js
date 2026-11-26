jest.mock('../repositories/paradasRepository', () => ({
  findNearestParada: jest.fn(),
  buscarPorNome: jest.fn(),
  findById: jest.fn(),
  findProximasPartidas: jest.fn(),
  criar: jest.fn(),
  atualizar: jest.fn(),
  contarLinhasNoItinerario: jest.fn(),
  excluir: jest.fn(),
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

  describe('obterParada (RF23)', () => {
    it('devolve a parada encontrada', async () => {
      const parada = { id: '3369', codigo: '3369', nome: 'Rodoviária' };
      paradasRepository.findById.mockResolvedValue(parada);

      await expect(paradasService.obterParada('3369')).resolves.toBe(parada);
      expect(paradasRepository.findById).toHaveBeenCalledWith('3369');
    });

    it('falha com 404 quando a parada não existe', async () => {
      paradasRepository.findById.mockResolvedValue(null);

      await expect(paradasService.obterParada('999')).rejects.toMatchObject({
        status: 404,
        message: 'Parada não encontrada.',
      });
    });
  });

  describe('criarParada (RF23)', () => {
    const dadosValidos = {
      codigo: ' 3369 ',
      nome: '  Rodoviária do Plano Piloto  ',
      latitude: '-15,7942',
      longitude: -47.8822,
      tipo: 'Placa',
      estrutura: 'SEM ESTRUTURA',
    };

    it('exige o código', async () => {
      await expect(paradasService.criarParada({ ...dadosValidos, codigo: '' })).rejects.toMatchObject({
        status: 400,
        message: 'O código da parada é obrigatório.',
      });
      expect(paradasRepository.criar).not.toHaveBeenCalled();
    });

    it('aceita no código apenas letras, números, ponto ou hífen', async () => {
      await expect(paradasService.criarParada({ ...dadosValidos, codigo: '33 69' })).rejects.toMatchObject({
        status: 400,
        message: 'O código da parada deve ter apenas letras, números, ponto ou hífen.',
      });
    });

    it('exige o nome', async () => {
      await expect(paradasService.criarParada({ ...dadosValidos, nome: '  ' })).rejects.toMatchObject({
        status: 400,
        message: 'O nome da parada é obrigatório.',
      });
    });

    it('exige latitude e longitude', async () => {
      await expect(paradasService.criarParada({ ...dadosValidos, latitude: '' })).rejects.toMatchObject({
        status: 400,
        message: 'A latitude é obrigatória.',
      });
      await expect(paradasService.criarParada({ ...dadosValidos, longitude: null })).rejects.toMatchObject({
        status: 400,
        message: 'A longitude é obrigatória.',
      });
    });

    it('rejeita coordenadas que não são números ou estão fora do intervalo', async () => {
      await expect(paradasService.criarParada({ ...dadosValidos, latitude: 'abc' })).rejects.toMatchObject({
        status: 400,
        message: 'A latitude deve ser um número entre -90 e 90.',
      });
      await expect(paradasService.criarParada({ ...dadosValidos, longitude: 200 })).rejects.toMatchObject({
        status: 400,
        message: 'A longitude deve ser um número entre -180 e 180.',
      });
    });

    it('limita o tamanho dos textos ao das colunas', async () => {
      await expect(
        paradasService.criarParada({ ...dadosValidos, estrutura: 'x'.repeat(81) })
      ).rejects.toMatchObject({ status: 400, message: 'A estrutura deve ter no máximo 80 caracteres.' });
    });

    it('impede código repetido', async () => {
      paradasRepository.findById.mockResolvedValue({ id: '3369' });

      await expect(paradasService.criarParada(dadosValidos)).rejects.toMatchObject({
        status: 409,
        message: 'Já existe uma parada com o código 3369.',
      });
      expect(paradasRepository.criar).not.toHaveBeenCalled();
    });

    it('cria a parada com os textos limpos e as coordenadas convertidas', async () => {
      paradasRepository.findById.mockResolvedValue(null);
      paradasRepository.criar.mockResolvedValue({ id: '3369' });

      const resultado = await paradasService.criarParada(dadosValidos);

      expect(paradasRepository.findById).toHaveBeenCalledWith('3369');
      expect(paradasRepository.criar).toHaveBeenCalledWith({
        codigo: '3369',
        nome: 'Rodoviária do Plano Piloto',
        latitude: -15.7942,
        longitude: -47.8822,
        tipo: 'Placa',
        estrutura: 'SEM ESTRUTURA',
      });
      expect(resultado).toEqual({ id: '3369' });
    });

    it('grava como nulos tipo e estrutura vazios', async () => {
      paradasRepository.findById.mockResolvedValue(null);
      paradasRepository.criar.mockResolvedValue({ id: '3369' });

      await paradasService.criarParada({ ...dadosValidos, tipo: '', estrutura: undefined });

      expect(paradasRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: null, estrutura: null })
      );
    });
  });

  describe('editarParada (RF23)', () => {
    it('falha se a parada não existir', async () => {
      paradasRepository.findById.mockResolvedValue(null);

      await expect(
        paradasService.editarParada('999', { nome: 'X', latitude: -15, longitude: -47 })
      ).rejects.toMatchObject({ status: 404, message: 'Parada não encontrada.' });
      expect(paradasRepository.atualizar).not.toHaveBeenCalled();
    });

    it('valida os dados como na criação', async () => {
      paradasRepository.findById.mockResolvedValue({ id: '3369' });

      await expect(
        paradasService.editarParada('3369', { nome: 'Rodoviária', longitude: -47 })
      ).rejects.toMatchObject({ status: 400, message: 'A latitude é obrigatória.' });
      expect(paradasRepository.atualizar).not.toHaveBeenCalled();
    });

    it('atualiza a parada sem repassar o código', async () => {
      paradasRepository.findById.mockResolvedValue({ id: '3369' });
      paradasRepository.atualizar.mockResolvedValue({ id: '3369', nome: 'Rodoviária' });

      const resultado = await paradasService.editarParada('3369', {
        codigo: '9999',
        nome: 'Rodoviária',
        latitude: -15.79,
        longitude: '-47,88',
      });

      expect(paradasRepository.atualizar).toHaveBeenCalledWith('3369', {
        nome: 'Rodoviária',
        latitude: -15.79,
        longitude: -47.88,
        tipo: null,
        estrutura: null,
      });
      expect(resultado).toEqual({ id: '3369', nome: 'Rodoviária' });
    });
  });

  describe('excluirParada (RF23)', () => {
    it('falha se a parada não existir', async () => {
      paradasRepository.findById.mockResolvedValue(null);

      await expect(paradasService.excluirParada('999')).rejects.toMatchObject({
        status: 404,
        message: 'Parada não encontrada.',
      });
      expect(paradasRepository.excluir).not.toHaveBeenCalled();
    });

    it('bloqueia a exclusão de parada que está no itinerário de alguma linha', async () => {
      paradasRepository.findById.mockResolvedValue({ id: '3369' });
      paradasRepository.contarLinhasNoItinerario.mockResolvedValue(3);

      await expect(paradasService.excluirParada('3369')).rejects.toMatchObject({
        status: 409,
        message: 'A parada não pode ser excluída porque faz parte do itinerário de 3 linhas.',
      });
      expect(paradasRepository.excluir).not.toHaveBeenCalled();
    });

    it('usa o singular quando a parada está no itinerário de uma linha', async () => {
      paradasRepository.findById.mockResolvedValue({ id: '3369' });
      paradasRepository.contarLinhasNoItinerario.mockResolvedValue(1);

      await expect(paradasService.excluirParada('3369')).rejects.toMatchObject({
        message: 'A parada não pode ser excluída porque faz parte do itinerário de 1 linha.',
      });
    });

    it('exclui a parada que não está em nenhum itinerário', async () => {
      paradasRepository.findById.mockResolvedValue({ id: '3369' });
      paradasRepository.contarLinhasNoItinerario.mockResolvedValue(0);
      paradasRepository.excluir.mockResolvedValue();

      await paradasService.excluirParada('3369');

      expect(paradasRepository.contarLinhasNoItinerario).toHaveBeenCalledWith('3369');
      expect(paradasRepository.excluir).toHaveBeenCalledWith('3369');
    });
  });
});
