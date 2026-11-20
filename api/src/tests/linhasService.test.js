jest.mock('../repositories/linhasRepository', () => ({
  findLinhas: jest.fn(),
  findItinerarioByLinhaId: jest.fn(),
  findHorariosByLinhaId: jest.fn(),
}));

const linhasRepository = require('../repositories/linhasRepository');
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
  });
});
