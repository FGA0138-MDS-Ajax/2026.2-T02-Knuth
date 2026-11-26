jest.mock('../repositories/linhasRepository', () => ({
  findLinhas: jest.fn(),
  findItinerarioByLinhaId: jest.fn(),
  findHorariosByLinhaId: jest.fn(),
  buscarPorId: jest.fn(),
  criar: jest.fn(),
  atualizar: jest.fn(),
  excluir: jest.fn(),
  listarPartidas: jest.fn(),
  buscarPartida: jest.fn(),
  buscarPartidaMaisProxima: jest.fn(),
  criarPartida: jest.fn(),
  deslocarPartida: jest.fn(),
  excluirPartida: jest.fn(),
  listarViagensDoSentido: jest.fn(),
  paradaEstaNoItinerario: jest.fn(),
  incluirParadaNoItinerario: jest.fn(),
  removerParadaDoItinerario: jest.fn(),
}));

jest.mock('../repositories/paradasRepository', () => ({
  findById: jest.fn(),
}));

const linhasRepository = require('../repositories/linhasRepository');
const paradasRepository = require('../repositories/paradasRepository');
const linhasService = require('../services/linhasService');

describe('LinhasService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('obterLinhas (RF07)', () => {
    it('repassa um objeto de filtros ao repositório e retorna as linhas', async () => {
      const filtros = { bacia: 'Norte', regiao: 'Centro', tipo: 'URBANA' };
      const linhas = [{ id: 1, codigo: '101' }];
      linhasRepository.findLinhas.mockResolvedValue(linhas);

      const resultado = await linhasService.obterLinhas(filtros);

      expect(linhasRepository.findLinhas).toHaveBeenCalledWith(filtros);
      expect(resultado).toBe(linhas);
    });

    it('aceita busca por texto simples', async () => {
      linhasRepository.findLinhas.mockResolvedValue([]);

      await linhasService.obterLinhas('101');

      expect(linhasRepository.findLinhas).toHaveBeenCalledWith('101');
    });
  });

  describe('listarLinhasComFiltros (alias)', () => {
    it('delega para obterLinhas com os mesmos filtros', async () => {
      const filtros = { tipo: 'URBANA' };
      const espiao = jest.spyOn(linhasService, 'obterLinhas').mockResolvedValue(['linha']);

      const resultado = await linhasService.listarLinhasComFiltros(filtros);

      expect(espiao).toHaveBeenCalledWith(filtros);
      expect(resultado).toEqual(['linha']);
    });

    it('chega ao repositório e retorna o mesmo resultado de obterLinhas', async () => {
      const filtros = { regiao: 'Sul' };
      const linhas = [{ id: 2 }];
      linhasRepository.findLinhas.mockResolvedValue(linhas);

      const resultado = await linhasService.listarLinhasComFiltros(filtros);

      expect(linhasRepository.findLinhas).toHaveBeenCalledWith(filtros);
      expect(resultado).toBe(linhas);
    });
  });

  describe('obterItinerario (RF08)', () => {
    const cabecalho = {
      linha_id: 1,
      linha_codigo: '101',
      linha_nome: 'Centro / UNB',
      linha_cor: '#FF0000',
    };

    const linhaItinerario = (sentido, sequencia, paradaId, nome, lat, lng) => ({
      ...cabecalho,
      sentido,
      sequencia,
      parada_id: paradaId,
      parada_codigo: `P${paradaId}`,
      parada_nome: nome,
      latitude: lat,
      longitude: lng,
    });

    it('consulta o repositório pelo id da linha', async () => {
      linhasRepository.findItinerarioByLinhaId.mockResolvedValue([]);

      await linhasService.obterItinerario(1);

      expect(linhasRepository.findItinerarioByLinhaId).toHaveBeenCalledWith(1);
    });

    it.each([
      ['null', null],
      ['lista vazia', []],
    ])('retorna null quando o repositório devolve %s', async (_desc, retorno) => {
      linhasRepository.findItinerarioByLinhaId.mockResolvedValue(retorno);

      await expect(linhasService.obterItinerario(1)).resolves.toBeNull();
    });

    it('monta os dados da linha a partir da primeira linha retornada', async () => {
      linhasRepository.findItinerarioByLinhaId.mockResolvedValue([
        linhaItinerario('IDA', 1, 10, 'Terminal', '-10.1840', '-48.3336'),
      ]);

      const resultado = await linhasService.obterItinerario(1);

      expect(resultado.linhaId).toBe(1);
      expect(resultado.codigo).toBe('101');
      expect(resultado.nome).toBe('Centro / UNB');
      expect(resultado.cor).toBe('#FF0000');
    });

    it('separa as paradas em IDA e VOLTA preservando a ordem e convertendo coordenadas para número', async () => {
      linhasRepository.findItinerarioByLinhaId.mockResolvedValue([
        linhaItinerario('IDA', 1, 10, 'Terminal', '-10.1840', '-48.3336'),
        linhaItinerario('IDA', 2, 11, 'Praça', '-10.1900', '-48.3300'),
        linhaItinerario('VOLTA', 1, 11, 'Praça', '-10.1900', '-48.3300'),
      ]);

      const resultado = await linhasService.obterItinerario(1);

      expect(resultado.itinerario.IDA).toEqual([
        { sequencia: 1, paradaId: 10, codigo: 'P10', nome: 'Terminal', latitude: -10.184, longitude: -48.3336 },
        { sequencia: 2, paradaId: 11, codigo: 'P11', nome: 'Praça', latitude: -10.19, longitude: -48.33 },
      ]);
      expect(resultado.itinerario.VOLTA).toEqual([
        { sequencia: 1, paradaId: 11, codigo: 'P11', nome: 'Praça', latitude: -10.19, longitude: -48.33 },
      ]);
    });

    it('mantém VOLTA vazio quando só existem paradas de IDA', async () => {
      linhasRepository.findItinerarioByLinhaId.mockResolvedValue([
        linhaItinerario('IDA', 1, 10, 'Terminal', '-10.18', '-48.33'),
      ]);

      const resultado = await linhasService.obterItinerario(1);

      expect(resultado.itinerario.IDA).toHaveLength(1);
      expect(resultado.itinerario.VOLTA).toEqual([]);
    });

    it('ignora paradas com sentido desconhecido', async () => {
      linhasRepository.findItinerarioByLinhaId.mockResolvedValue([
        linhaItinerario('IDA', 1, 10, 'Terminal', '-10.18', '-48.33'),
        linhaItinerario('CIRCULAR', 2, 12, 'Outra', '-10.20', '-48.40'),
      ]);

      const resultado = await linhasService.obterItinerario(1);

      expect(resultado.itinerario.IDA).toHaveLength(1);
      expect(resultado.itinerario.VOLTA).toHaveLength(0);
    });
  });

  describe('obterQuadroHorarios (RF10)', () => {
    const cabecalho = { linha_id: 1, linha_codigo: '101', linha_nome: 'Centro / UNB' };
    const horario = (sentido, tipoDia, hora) => ({
      ...cabecalho,
      sentido,
      tipo_dia: tipoDia,
      horario_partida: hora,
    });

    it('consulta o repositório pelo id da linha', async () => {
      linhasRepository.findHorariosByLinhaId.mockResolvedValue([]);

      await linhasService.obterQuadroHorarios(1);

      expect(linhasRepository.findHorariosByLinhaId).toHaveBeenCalledWith(1);
    });

    it.each([
      ['null', null],
      ['lista vazia', []],
    ])('retorna null quando o repositório devolve %s', async (_desc, retorno) => {
      linhasRepository.findHorariosByLinhaId.mockResolvedValue(retorno);

      await expect(linhasService.obterQuadroHorarios(1)).resolves.toBeNull();
    });

    it('monta o cabeçalho e a estrutura vazia de sentidos x tipos de dia', async () => {
      linhasRepository.findHorariosByLinhaId.mockResolvedValue([
        horario('IDA', 'DIA_UTIL', '06:00:00'),
      ]);

      const resultado = await linhasService.obterQuadroHorarios(1);

      expect(resultado.linhaId).toBe(1);
      expect(resultado.codigo).toBe('101');
      expect(resultado.nome).toBe('Centro / UNB');
      expect(resultado.quadroHorarios.VOLTA).toEqual({ DIA_UTIL: [], SABADO: [], DOMINGO_FERIADO: [] });
    });

    it('agrupa os horários por sentido e tipo de dia', async () => {
      linhasRepository.findHorariosByLinhaId.mockResolvedValue([
        horario('IDA', 'DIA_UTIL', '06:00:00'),
        horario('IDA', 'DIA_UTIL', '06:30:00'),
        horario('IDA', 'SABADO', '07:00:00'),
        horario('VOLTA', 'DOMINGO_FERIADO', '08:00:00'),
      ]);

      const resultado = await linhasService.obterQuadroHorarios(1);

      expect(resultado.quadroHorarios).toEqual({
        IDA: { DIA_UTIL: ['06:00:00', '06:30:00'], SABADO: ['07:00:00'], DOMINGO_FERIADO: [] },
        VOLTA: { DIA_UTIL: [], SABADO: [], DOMINGO_FERIADO: ['08:00:00'] },
      });
    });

    it('não repete horários duplicados no mesmo grupo', async () => {
      linhasRepository.findHorariosByLinhaId.mockResolvedValue([
        horario('IDA', 'DIA_UTIL', '06:00:00'),
        horario('IDA', 'DIA_UTIL', '06:00:00'),
      ]);

      const resultado = await linhasService.obterQuadroHorarios(1);

      expect(resultado.quadroHorarios.IDA.DIA_UTIL).toEqual(['06:00:00']);
    });

    it('ignora linhas com sentido ou tipo de dia desconhecidos, sem lançar erro', async () => {
      linhasRepository.findHorariosByLinhaId.mockResolvedValue([
        horario('IDA', 'DIA_UTIL', '06:00:00'),
        horario('CIRCULAR', 'DIA_UTIL', '09:00:00'),
        horario('IDA', 'FERIADO_LOCAL', '10:00:00'),
      ]);

      const resultado = await linhasService.obterQuadroHorarios(1);

      expect(resultado.quadroHorarios.IDA.DIA_UTIL).toEqual(['06:00:00']);
      expect(resultado.quadroHorarios.CIRCULAR).toBeUndefined();
      expect(resultado.quadroHorarios.IDA.FERIADO_LOCAL).toBeUndefined();
    });

    it('inclui metadados enriquecidos da linha (tarifa, faixa, operadora, extensão e cor) quando presentes', async () => {
      linhasRepository.findHorariosByLinhaId.mockResolvedValue([
        {
          ...horario('IDA', 'DIA_UTIL', '06:00'),
          linha_cor: '#D97706',
          linha_tarifa: '5.50',
          linha_faixa_tarifaria: 'METROPOLITANA 2',
          linha_operadora: 'VIAÇÃO PIONEIRA BACIA - 02',
          linha_extensao_km: '42.35',
        },
      ]);

      const resultado = await linhasService.obterQuadroHorarios(1);

      expect(resultado.cor).toBe('#D97706');
      expect(resultado.tarifa).toBe(5.5);
      expect(resultado.faixaTarifaria).toBe('METROPOLITANA 2');
      expect(resultado.operadora).toBe('VIAÇÃO PIONEIRA BACIA - 02');
      expect(resultado.extensaoKm).toBe(42.35);
    });
  });

  describe('criarLinha (RF23)', () => {
    const dadosValidos = {
      codigo: ' 0.110 ',
      nome: '  Asa Sul / Rodoviária  ',
      cor: '#006666',
      tarifa: '5,50',
      faixa_tarifaria: 'METROPOLITANA 1',
      operadora: 'Urbi',
      extensao_km: '12.5',
    };

    it('exige o código', async () => {
      await expect(linhasService.criarLinha({ ...dadosValidos, codigo: '  ' })).rejects.toMatchObject({
        status: 400,
        message: 'O código da linha é obrigatório.',
      });
      expect(linhasRepository.criar).not.toHaveBeenCalled();
    });

    it('aceita no código apenas números e pontos', async () => {
      await expect(linhasService.criarLinha({ ...dadosValidos, codigo: '0.11A' })).rejects.toMatchObject({
        status: 400,
        message: 'O código da linha deve ter apenas números e pontos (ex.: 0.110).',
      });
    });

    it('exige o nome', async () => {
      await expect(linhasService.criarLinha({ ...dadosValidos, nome: '' })).rejects.toMatchObject({
        status: 400,
        message: 'O nome da linha é obrigatório.',
      });
    });

    it('rejeita cor fora do formato #RRGGBB', async () => {
      await expect(linhasService.criarLinha({ ...dadosValidos, cor: 'azul' })).rejects.toMatchObject({
        status: 400,
        message: 'A cor deve estar no formato #RRGGBB.',
      });
    });

    it('rejeita tarifa negativa ou que não é número', async () => {
      await expect(linhasService.criarLinha({ ...dadosValidos, tarifa: '-1' })).rejects.toMatchObject({
        status: 400,
        message: 'A tarifa deve ser um número entre 0 e 9999,99.',
      });
      await expect(linhasService.criarLinha({ ...dadosValidos, tarifa: 'cinco' })).rejects.toMatchObject({
        status: 400,
      });
    });

    it('rejeita extensão inválida', async () => {
      await expect(linhasService.criarLinha({ ...dadosValidos, extensao_km: 'abc' })).rejects.toMatchObject({
        status: 400,
        message: 'A extensão deve ser um número entre 0 e 999999,99.',
      });
    });

    it('limita o tamanho dos textos ao das colunas', async () => {
      await expect(
        linhasService.criarLinha({ ...dadosValidos, operadora: 'x'.repeat(121) })
      ).rejects.toMatchObject({ status: 400, message: 'A operadora deve ter no máximo 120 caracteres.' });
    });

    it('impede código repetido', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '0.110' });

      await expect(linhasService.criarLinha(dadosValidos)).rejects.toMatchObject({
        status: 409,
        message: 'Já existe uma linha com o código 0.110.',
      });
      expect(linhasRepository.criar).not.toHaveBeenCalled();
    });

    it('cria a linha com os textos limpos e os números convertidos', async () => {
      linhasRepository.buscarPorId.mockResolvedValue(null);
      linhasRepository.criar.mockResolvedValue({ id: '0.110' });

      const resultado = await linhasService.criarLinha(dadosValidos);

      expect(linhasRepository.buscarPorId).toHaveBeenCalledWith('0.110');
      expect(linhasRepository.criar).toHaveBeenCalledWith({
        codigo: '0.110',
        nome: 'Asa Sul / Rodoviária',
        cor: '#006666',
        tarifa: 5.5,
        faixaTarifaria: 'METROPOLITANA 1',
        operadora: 'Urbi',
        extensaoKm: 12.5,
      });
      expect(resultado).toEqual({ id: '0.110' });
    });

    it('grava como nulos os campos opcionais vazios', async () => {
      linhasRepository.buscarPorId.mockResolvedValue(null);
      linhasRepository.criar.mockResolvedValue({ id: '0.110' });

      await linhasService.criarLinha({ codigo: '0.110', nome: 'Asa Sul', cor: '', tarifa: '', faixa_tarifaria: '  ' });

      expect(linhasRepository.criar).toHaveBeenCalledWith({
        codigo: '0.110',
        nome: 'Asa Sul',
        cor: null,
        tarifa: null,
        faixaTarifaria: null,
        operadora: null,
        extensaoKm: null,
      });
    });
  });

  describe('editarLinha (RF23)', () => {
    it('falha se a linha não existir', async () => {
      linhasRepository.buscarPorId.mockResolvedValue(null);

      await expect(linhasService.editarLinha('999', { nome: 'X' })).rejects.toMatchObject({
        status: 404,
        message: 'Linha não encontrada.',
      });
      expect(linhasRepository.atualizar).not.toHaveBeenCalled();
    });

    it('valida os dados como na criação', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '0.110' });

      await expect(linhasService.editarLinha('0.110', { nome: '   ' })).rejects.toMatchObject({
        status: 400,
        message: 'O nome da linha é obrigatório.',
      });
      expect(linhasRepository.atualizar).not.toHaveBeenCalled();
    });

    it('atualiza a linha sem repassar o código', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '0.110' });
      linhasRepository.atualizar.mockResolvedValue({ id: '0.110', nome: 'Asa Norte' });

      const resultado = await linhasService.editarLinha('0.110', { codigo: '9.999', nome: 'Asa Norte', tarifa: 6 });

      expect(linhasRepository.atualizar).toHaveBeenCalledWith('0.110', {
        nome: 'Asa Norte',
        cor: null,
        tarifa: 6,
        faixaTarifaria: null,
        operadora: null,
        extensaoKm: null,
      });
      expect(resultado).toEqual({ id: '0.110', nome: 'Asa Norte' });
    });
  });

  describe('excluirLinha (RF23)', () => {
    it('falha se a linha não existir', async () => {
      linhasRepository.buscarPorId.mockResolvedValue(null);

      await expect(linhasService.excluirLinha('999')).rejects.toMatchObject({
        status: 404,
        message: 'Linha não encontrada.',
      });
      expect(linhasRepository.excluir).not.toHaveBeenCalled();
    });

    it('exclui a linha existente', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '0.110' });
      linhasRepository.excluir.mockResolvedValue();

      await linhasService.excluirLinha('0.110');

      expect(linhasRepository.excluir).toHaveBeenCalledWith('0.110');
    });
  });

  describe('listarPartidas (RF23)', () => {
    it('valida o sentido e o tipo de dia', async () => {
      await expect(linhasService.listarPartidas('0.110', 'CIRCULAR', 'SABADO')).rejects.toMatchObject({
        status: 400,
        message: 'O sentido deve ser IDA ou VOLTA.',
      });
      await expect(linhasService.listarPartidas('0.110', 'IDA', 'FERIADAO')).rejects.toMatchObject({
        status: 400,
        message: 'O tipo de dia deve ser DIA_UTIL, SABADO ou DOMINGO_FERIADO.',
      });
      expect(linhasRepository.listarPartidas).not.toHaveBeenCalled();
    });

    it('falha se a linha não existir', async () => {
      linhasRepository.buscarPorId.mockResolvedValue(null);

      await expect(linhasService.listarPartidas('999', 'IDA', 'SABADO')).rejects.toMatchObject({
        status: 404,
        message: 'Linha não encontrada.',
      });
    });

    it('devolve o id da viagem e o horário de cada partida', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '0.110' });
      linhasRepository.listarPartidas.mockResolvedValue([
        { viagem_id: 'TRIP_1', horario: '05:00' },
        { viagem_id: 'TRIP_2', horario: '05:30' },
      ]);

      const resultado = await linhasService.listarPartidas('0.110', 'IDA', 'SABADO');

      expect(linhasRepository.listarPartidas).toHaveBeenCalledWith('0.110', 'IDA', 'SABADO');
      expect(resultado).toEqual([
        { viagemId: 'TRIP_1', horario: '05:00' },
        { viagemId: 'TRIP_2', horario: '05:30' },
      ]);
    });
  });

  describe('incluirPartida (RF23)', () => {
    const dados = { sentido: 'IDA', tipoDia: 'SABADO', horario: '05:07' };

    it('valida sentido, tipo de dia e horário', async () => {
      await expect(linhasService.incluirPartida('0.110', { ...dados, sentido: 'X' })).rejects.toMatchObject({ status: 400 });
      await expect(linhasService.incluirPartida('0.110', { ...dados, tipoDia: 'X' })).rejects.toMatchObject({ status: 400 });
      await expect(linhasService.incluirPartida('0.110', { ...dados, horario: '5:7' })).rejects.toMatchObject({
        status: 400,
        message: 'O horário deve estar no formato HH:MM.',
      });
      expect(linhasRepository.criarPartida).not.toHaveBeenCalled();
    });

    it('falha se a linha não existir', async () => {
      linhasRepository.buscarPorId.mockResolvedValue(null);

      await expect(linhasService.incluirPartida('999', dados)).rejects.toMatchObject({
        status: 404,
        message: 'Linha não encontrada.',
      });
    });

    it('exige uma viagem do mesmo sentido e tipo de dia para copiar', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '0.110' });
      linhasRepository.buscarPartidaMaisProxima.mockResolvedValue(null);

      await expect(linhasService.incluirPartida('0.110', dados)).rejects.toMatchObject({
        status: 400,
        message: 'A linha não tem nenhuma viagem neste sentido e tipo de dia para servir de modelo.',
      });
      expect(linhasRepository.criarPartida).not.toHaveBeenCalled();
    });

    it('impede duas partidas no mesmo horário', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '0.110' });
      linhasRepository.buscarPartidaMaisProxima.mockResolvedValue({ viagem_id: 'TRIP_1', horario: '05:07' });

      await expect(linhasService.incluirPartida('0.110', dados)).rejects.toMatchObject({
        status: 409,
        message: 'Já existe uma partida às 05:07 neste sentido e tipo de dia.',
      });
      expect(linhasRepository.criarPartida).not.toHaveBeenCalled();
    });

    it('copia a viagem mais próxima deslocando os horários para a nova partida', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '0.110' });
      linhasRepository.buscarPartidaMaisProxima.mockResolvedValue({ viagem_id: 'TRIP_1', horario: '05:01' });
      linhasRepository.criarPartida.mockResolvedValue('MANUAL_1');

      const resultado = await linhasService.incluirPartida('0.110', dados);

      expect(linhasRepository.buscarPartidaMaisProxima).toHaveBeenCalledWith('0.110', 'IDA', 'SABADO', '05:07:00');
      expect(linhasRepository.criarPartida).toHaveBeenCalledWith('TRIP_1', '05:07:00');
      expect(resultado).toEqual({ viagemId: 'MANUAL_1', horario: '05:07' });
    });
  });

  describe('alterarPartida (RF23)', () => {
    const partida = { viagem_id: 'TRIP_1', sentido: 'IDA', tipo_dia: 'SABADO', horario: '05:00' };

    it('valida o horário', async () => {
      await expect(linhasService.alterarPartida('0.110', 'TRIP_1', { horario: '25:00' })).rejects.toMatchObject({
        status: 400,
        message: 'O horário deve estar no formato HH:MM.',
      });
      expect(linhasRepository.deslocarPartida).not.toHaveBeenCalled();
    });

    it('falha se a partida não for da linha', async () => {
      linhasRepository.buscarPartida.mockResolvedValue(null);

      await expect(linhasService.alterarPartida('0.110', 'TRIP_X', { horario: '05:10' })).rejects.toMatchObject({
        status: 404,
        message: 'Partida não encontrada.',
      });
      expect(linhasRepository.buscarPartida).toHaveBeenCalledWith('0.110', 'TRIP_X');
    });

    it('impede mudar para o horário de outra partida', async () => {
      linhasRepository.buscarPartida.mockResolvedValue(partida);
      linhasRepository.buscarPartidaMaisProxima.mockResolvedValue({ viagem_id: 'TRIP_2', horario: '05:30' });

      await expect(linhasService.alterarPartida('0.110', 'TRIP_1', { horario: '05:30' })).rejects.toMatchObject({
        status: 409,
        message: 'Já existe uma partida às 05:30 neste sentido e tipo de dia.',
      });
      expect(linhasRepository.deslocarPartida).not.toHaveBeenCalled();
    });

    it('desloca os horários da viagem para o novo horário', async () => {
      linhasRepository.buscarPartida.mockResolvedValue(partida);
      linhasRepository.buscarPartidaMaisProxima.mockResolvedValue({ viagem_id: 'TRIP_1', horario: '05:00' });
      linhasRepository.deslocarPartida.mockResolvedValue();

      const resultado = await linhasService.alterarPartida('0.110', 'TRIP_1', { horario: '05:10' });

      expect(linhasRepository.buscarPartidaMaisProxima).toHaveBeenCalledWith('0.110', 'IDA', 'SABADO', '05:10:00');
      expect(linhasRepository.deslocarPartida).toHaveBeenCalledWith('TRIP_1', '05:10:00');
      expect(resultado).toEqual({ viagemId: 'TRIP_1', horario: '05:10' });
    });
  });

  describe('excluirPartida (RF23)', () => {
    it('falha se a partida não for da linha', async () => {
      linhasRepository.buscarPartida.mockResolvedValue(null);

      await expect(linhasService.excluirPartida('0.110', 'TRIP_X')).rejects.toMatchObject({
        status: 404,
        message: 'Partida não encontrada.',
      });
      expect(linhasRepository.excluirPartida).not.toHaveBeenCalled();
    });

    it('exclui a viagem da partida', async () => {
      linhasRepository.buscarPartida.mockResolvedValue({ viagem_id: 'TRIP_1' });
      linhasRepository.excluirPartida.mockResolvedValue();

      await linhasService.excluirPartida('0.110', 'TRIP_1');

      expect(linhasRepository.excluirPartida).toHaveBeenCalledWith('TRIP_1');
    });
  });

  describe('incluirParadaNoItinerario (RF23)', () => {
    const dados = { sentido: 'IDA', paradaId: '6710', depoisDaSequencia: 1 };
    const viagem = (campos) => ({
      viagem_id: 'TRIP_1',
      horario_na_sequencia: null,
      horario_na_seguinte: null,
      primeira: '05:01:00',
      ultima: '05:46:00',
      total: '86',
      ...campos,
    });

    // Prepara linha e parada existentes e devolve o horário calculado para a viagem informada
    const incluirComViagens = async (viagens, extras = {}) => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '2302' });
      paradasRepository.findById.mockResolvedValue({ id: '6710' });
      linhasRepository.listarViagensDoSentido.mockResolvedValue(viagens);
      linhasRepository.paradaEstaNoItinerario.mockResolvedValue(false);
      linhasRepository.incluirParadaNoItinerario.mockResolvedValue();

      await linhasService.incluirParadaNoItinerario('2302', { ...dados, ...extras });

      return linhasRepository.incluirParadaNoItinerario.mock.calls[0][4];
    };

    it('valida sentido, parada e posição', async () => {
      await expect(linhasService.incluirParadaNoItinerario('2302', { ...dados, sentido: 'X' })).rejects.toMatchObject({
        status: 400,
        message: 'O sentido deve ser IDA ou VOLTA.',
      });
      await expect(linhasService.incluirParadaNoItinerario('2302', { ...dados, paradaId: ' ' })).rejects.toMatchObject({
        status: 400,
        message: 'Informe a parada que vai entrar no itinerário.',
      });
      await expect(
        linhasService.incluirParadaNoItinerario('2302', { ...dados, depoisDaSequencia: -1 })
      ).rejects.toMatchObject({ status: 400, message: 'A posição no itinerário é inválida.' });
      await expect(
        linhasService.incluirParadaNoItinerario('2302', { ...dados, depoisDaSequencia: 'abc' })
      ).rejects.toMatchObject({ status: 400 });
      expect(linhasRepository.incluirParadaNoItinerario).not.toHaveBeenCalled();
    });

    it('falha se a linha não existir', async () => {
      linhasRepository.buscarPorId.mockResolvedValue(null);

      await expect(linhasService.incluirParadaNoItinerario('999', dados)).rejects.toMatchObject({
        status: 404,
        message: 'Linha não encontrada.',
      });
    });

    it('falha se a parada não existir', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '2302' });
      paradasRepository.findById.mockResolvedValue(null);

      await expect(linhasService.incluirParadaNoItinerario('2302', dados)).rejects.toMatchObject({
        status: 404,
        message: 'Parada não encontrada.',
      });
      expect(paradasRepository.findById).toHaveBeenCalledWith('6710');
    });

    it('exige viagens no sentido', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '2302' });
      paradasRepository.findById.mockResolvedValue({ id: '6710' });
      linhasRepository.listarViagensDoSentido.mockResolvedValue([]);

      await expect(linhasService.incluirParadaNoItinerario('2302', dados)).rejects.toMatchObject({
        status: 400,
        message: 'A linha não tem viagens neste sentido.',
      });
    });

    it('rejeita posição depois do fim do itinerário', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '2302' });
      paradasRepository.findById.mockResolvedValue({ id: '6710' });
      linhasRepository.listarViagensDoSentido.mockResolvedValue([viagem({ total: '86' })]);

      await expect(
        linhasService.incluirParadaNoItinerario('2302', { ...dados, depoisDaSequencia: 87 })
      ).rejects.toMatchObject({ status: 400, message: 'A posição no itinerário é inválida.' });
    });

    it('impede incluir uma parada que já está no itinerário do sentido', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '2302' });
      paradasRepository.findById.mockResolvedValue({ id: '6710' });
      linhasRepository.listarViagensDoSentido.mockResolvedValue([viagem({ horario_na_sequencia: '05:01:00' })]);
      linhasRepository.paradaEstaNoItinerario.mockResolvedValue(true);

      await expect(linhasService.incluirParadaNoItinerario('2302', dados)).rejects.toMatchObject({
        status: 409,
        message: 'A parada já faz parte do itinerário deste sentido.',
      });
      expect(linhasRepository.incluirParadaNoItinerario).not.toHaveBeenCalled();
    });

    it('entre duas paradas, usa o ponto médio entre a anterior e a seguinte', async () => {
      const horarios = await incluirComViagens([
        viagem({ horario_na_sequencia: '05:01:00', horario_na_seguinte: '05:01:31' }),
      ]);

      expect(linhasRepository.listarViagensDoSentido).toHaveBeenCalledWith('2302', 'IDA', 1);
      expect(linhasRepository.incluirParadaNoItinerario).toHaveBeenCalledWith('2302', 'IDA', 1, '6710', horarios);
      expect(horarios).toEqual([{ viagemId: 'TRIP_1', horario: '05:01:16' }]);
    });

    it('calcula o horário de cada viagem separadamente', async () => {
      const horarios = await incluirComViagens([
        viagem({ viagem_id: 'TRIP_1', horario_na_sequencia: '05:00:00', horario_na_seguinte: '05:10:00' }),
        viagem({ viagem_id: 'TRIP_2', horario_na_sequencia: '06:00:00', horario_na_seguinte: '06:20:00' }),
      ]);

      expect(horarios).toEqual([
        { viagemId: 'TRIP_1', horario: '05:05:00' },
        { viagemId: 'TRIP_2', horario: '06:10:00' },
      ]);
    });

    it('trata a virada da meia-noite no ponto médio', async () => {
      const horarios = await incluirComViagens([
        viagem({ horario_na_sequencia: '23:59:00', horario_na_seguinte: '00:01:00' }),
      ]);

      expect(horarios[0].horario).toBe('00:00:00');
    });

    it('no fim, soma à última parada o intervalo médio entre paradas da viagem', async () => {
      const horarios = await incluirComViagens(
        [viagem({ horario_na_sequencia: '05:46:00', horario_na_seguinte: null })],
        { depoisDaSequencia: 86 }
      );

      // 45 min divididos em 85 trechos = 31,76 s
      expect(horarios[0].horario).toBe('05:46:32');
    });

    it('no início, subtrai da primeira parada o intervalo médio entre paradas da viagem', async () => {
      const horarios = await incluirComViagens(
        [viagem({ horario_na_sequencia: null, horario_na_seguinte: '05:01:00' })],
        { depoisDaSequencia: 0 }
      );

      expect(linhasRepository.listarViagensDoSentido).toHaveBeenCalledWith('2302', 'IDA', 0);
      expect(horarios[0].horario).toBe('05:00:28');
    });

    it('no início, trata a virada da meia-noite', async () => {
      const horarios = await incluirComViagens(
        [viagem({ horario_na_seguinte: '00:00:10', primeira: '00:00:10', ultima: '00:10:10', total: '11' })],
        { depoisDaSequencia: 0 }
      );

      expect(horarios[0].horario).toBe('23:59:10');
    });

    it('coloca a parada no início quando a posição não é informada', async () => {
      const { depoisDaSequencia, ...semPosicao } = dados;
      linhasRepository.buscarPorId.mockResolvedValue({ id: '2302' });
      paradasRepository.findById.mockResolvedValue({ id: '6710' });
      linhasRepository.listarViagensDoSentido.mockResolvedValue([viagem({ horario_na_seguinte: '05:01:00' })]);
      linhasRepository.paradaEstaNoItinerario.mockResolvedValue(false);

      await linhasService.incluirParadaNoItinerario('2302', semPosicao);

      expect(linhasRepository.incluirParadaNoItinerario).toHaveBeenCalledWith(
        '2302',
        'IDA',
        0,
        '6710',
        expect.any(Array)
      );
    });
  });

  describe('removerParadaDoItinerario (RF23)', () => {
    const viagens = [
      { viagem_id: 'TRIP_1', horario_na_sequencia: '05:10:00', total: '86' },
      { viagem_id: 'TRIP_2', horario_na_sequencia: '06:10:00', total: '86' },
    ];

    it('valida sentido e posição', async () => {
      await expect(linhasService.removerParadaDoItinerario('2302', 'X', '5')).rejects.toMatchObject({
        status: 400,
        message: 'O sentido deve ser IDA ou VOLTA.',
      });
      await expect(linhasService.removerParadaDoItinerario('2302', 'IDA', '0')).rejects.toMatchObject({
        status: 400,
        message: 'A posição no itinerário é inválida.',
      });
      expect(linhasRepository.removerParadaDoItinerario).not.toHaveBeenCalled();
    });

    it('falha se a linha não existir', async () => {
      linhasRepository.buscarPorId.mockResolvedValue(null);

      await expect(linhasService.removerParadaDoItinerario('999', 'IDA', '5')).rejects.toMatchObject({
        status: 404,
        message: 'Linha não encontrada.',
      });
    });

    it('exige viagens no sentido', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '2302' });
      linhasRepository.listarViagensDoSentido.mockResolvedValue([]);

      await expect(linhasService.removerParadaDoItinerario('2302', 'IDA', '5')).rejects.toMatchObject({
        status: 400,
        message: 'A linha não tem viagens neste sentido.',
      });
    });

    it('falha quando não há parada nessa posição', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '2302' });
      linhasRepository.listarViagensDoSentido.mockResolvedValue([{ ...viagens[0], horario_na_sequencia: null }]);

      await expect(linhasService.removerParadaDoItinerario('2302', 'IDA', '99')).rejects.toMatchObject({
        status: 404,
        message: 'Parada não encontrada no itinerário.',
      });
    });

    it('mantém pelo menos 2 paradas no itinerário', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '2302' });
      linhasRepository.listarViagensDoSentido.mockResolvedValue([{ ...viagens[0], total: '2' }]);

      await expect(linhasService.removerParadaDoItinerario('2302', 'IDA', '1')).rejects.toMatchObject({
        status: 400,
        message: 'O itinerário precisa ter pelo menos 2 paradas.',
      });
      expect(linhasRepository.removerParadaDoItinerario).not.toHaveBeenCalled();
    });

    it('remove a parada da posição em todas as viagens do sentido', async () => {
      linhasRepository.buscarPorId.mockResolvedValue({ id: '2302' });
      linhasRepository.listarViagensDoSentido.mockResolvedValue(viagens);
      linhasRepository.removerParadaDoItinerario.mockResolvedValue();

      await linhasService.removerParadaDoItinerario('2302', 'IDA', '5');

      expect(linhasRepository.listarViagensDoSentido).toHaveBeenCalledWith('2302', 'IDA', 5);
      expect(linhasRepository.removerParadaDoItinerario).toHaveBeenCalledWith('2302', 'IDA', 5);
    });
  });
});
