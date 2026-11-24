jest.mock('../repositories/trajetosRepository', () => ({
  buscarParadasPorNome: jest.fn(),
  buscarRotasDiretas: jest.fn(),
  buscarRotasComBaldeacao: jest.fn(),
}));

const trajetosRepository = require('../repositories/trajetosRepository');
const trajetosService = require('../services/trajetosService');

const viagemDireta = (sobrescritas = {}) => ({
  horario_origem: '08:00:00',
  horario_destino: '08:25:00',
  duracao: 25,
  linha_codigo: '101',
  nome_origem: 'Terminal Central',
  nome_destino: 'UNB',
  qtd_paradas: 7,
  ...sobrescritas,
});

const viagemComBaldeacao = (sobrescritas = {}) => ({
  hora_origem: '08:00:00',
  hora_destino: '09:00:00',
  duracao_total: 40,
  linha_1: '101',
  linha_2: '202',
  nome_origem: 'Terminal Central',
  nome_transferencia: 'Praça',
  nome_destino: 'UNB',
  paradas_leg1: 5,
  paradas_leg2: 8,
  hora_chegada_transfer: '08:20:00',
  hora_saida_transfer: '08:30:00',
  ...sobrescritas,
});

function mockParadas(paradasOrigem, paradasDestino) {
  trajetosRepository.buscarParadasPorNome.mockReset();
  trajetosRepository.buscarParadasPorNome
    .mockResolvedValueOnce(paradasOrigem)
    .mockResolvedValueOnce(paradasDestino);
}

describe('TrajetosService.obterTrajetos', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockParadas([{ id: 1, nome: 'Terminal Central' }], [{ id: 2, nome: 'UNB' }]);
    trajetosRepository.buscarRotasDiretas.mockResolvedValue([]);
    trajetosRepository.buscarRotasComBaldeacao.mockResolvedValue([]);
  });

  describe('resolução das paradas', () => {
    it('busca as paradas pelo nome de origem e de destino', async () => {
      await trajetosService.obterTrajetos('Terminal Central', 'UNB');

      expect(trajetosRepository.buscarParadasPorNome).toHaveBeenCalledWith('Terminal Central');
      expect(trajetosRepository.buscarParadasPorNome).toHaveBeenCalledWith('UNB');
    });

    it('retorna lista vazia quando a origem não é encontrada', async () => {
      mockParadas([], [{ id: 2 }]);

      await expect(trajetosService.obterTrajetos('???', 'UNB')).resolves.toEqual([]);
      expect(trajetosRepository.buscarRotasDiretas).not.toHaveBeenCalled();
      expect(trajetosRepository.buscarRotasComBaldeacao).not.toHaveBeenCalled();
    });

    it('retorna lista vazia quando o destino não é encontrado', async () => {
      mockParadas([{ id: 1 }], []);

      await expect(trajetosService.obterTrajetos('Terminal Central', '???')).resolves.toEqual([]);
      expect(trajetosRepository.buscarRotasDiretas).not.toHaveBeenCalled();
      expect(trajetosRepository.buscarRotasComBaldeacao).not.toHaveBeenCalled();
    });

    it('usa os ids de todas as paradas candidatas encontradas em cada busca', async () => {
      mockParadas([{ id: 1 }, { id: 99 }], [{ id: 2 }, { id: 88 }]);

      await trajetosService.obterTrajetos('Terminal', 'UNB');

      expect(trajetosRepository.buscarRotasDiretas).toHaveBeenCalledWith([1, 99], [2, 88]);
      expect(trajetosRepository.buscarRotasComBaldeacao).toHaveBeenCalledWith([1, 99], [2, 88]);
    });

    it('retorna lista vazia quando não há rotas diretas nem com baldeação', async () => {
      await expect(trajetosService.obterTrajetos('Terminal Central', 'UNB')).resolves.toEqual([]);
    });
  });

  describe('rotas diretas', () => {
    it('converte a viagem em uma opção com uma única etapa de ônibus', async () => {
      trajetosRepository.buscarRotasDiretas.mockResolvedValue([viagemDireta()]);

      const resultado = await trajetosService.obterTrajetos('Terminal Central', 'UNB');

      expect(resultado).toEqual([
        {
          partida: '08:00:00',
          chegada: '08:25:00',
          duracaoMinutos: 25,
          baldeacoes: 0,
          caminhadaMetros: 0,
          afetadaPorAlerta: false,
          etapas: [
            {
              ordem: 1,
              duracaoMinutos: 25,
              instrucao:
                'Embarque na linha 101 em "Terminal Central" e desça em "UNB" após 7 paradas.',
              tipo: 'ONIBUS',
            },
          ],
        },
      ]);
    });

    it('gera uma opção para cada viagem direta', async () => {
      trajetosRepository.buscarRotasDiretas.mockResolvedValue([
        viagemDireta({ horario_origem: '08:00:00' }),
        viagemDireta({ horario_origem: '09:00:00' }),
        viagemDireta({ horario_origem: '10:00:00' }),
      ]);

      const resultado = await trajetosService.obterTrajetos('Terminal Central', 'UNB');

      expect(resultado.map((o) => o.partida)).toEqual(['08:00:00', '09:00:00', '10:00:00']);
    });

    it.each([
      [12.4, 12],
      [12.5, 13],
      [0.2, 1],
      [0, 1],
    ])('arredonda a duração %p para %p minutos (mínimo de 1)', async (duracao, esperado) => {
      trajetosRepository.buscarRotasDiretas.mockResolvedValue([viagemDireta({ duracao })]);

      const [opcao] = await trajetosService.obterTrajetos('Terminal Central', 'UNB');

      expect(opcao.duracaoMinutos).toBe(esperado);
      expect(opcao.etapas[0].duracaoMinutos).toBe(esperado);
    });
  });

  describe('rotas com baldeação', () => {
    it('converte a viagem em uma opção com 3 etapas (ônibus, baldeação, ônibus)', async () => {
      trajetosRepository.buscarRotasComBaldeacao.mockResolvedValue([viagemComBaldeacao()]);

      const resultado = await trajetosService.obterTrajetos('Terminal Central', 'UNB');

      expect(resultado).toEqual([
        {
          partida: '08:00:00',
          chegada: '09:00:00',
          duracaoMinutos: 40,
          baldeacoes: 1,
          caminhadaMetros: 0,
          afetadaPorAlerta: false,
          etapas: [
            {
              ordem: 1,
              duracaoMinutos: 20,
              instrucao:
                'Embarque na linha 101 em "Terminal Central" e desça em "Praça" após 5 paradas.',
              tipo: 'ONIBUS',
            },
            {
              ordem: 2,
              duracaoMinutos: 10,
              instrucao: 'Faça a baldeação na parada "Praça". Aguarde o próximo ônibus.',
              tipo: 'CAMINHADA',
            },
            {
              ordem: 3,
              duracaoMinutos: 20,
              instrucao: 'Embarque na linha 202 e desça em "UNB" após 8 paradas.',
              tipo: 'ONIBUS',
            },
          ],
        },
      ]);
    });

    it('divide a duração total ao meio entre os dois trechos de ônibus', async () => {
      trajetosRepository.buscarRotasComBaldeacao.mockResolvedValue([
        viagemComBaldeacao({ duracao_total: 15 }),
      ]);

      const [opcao] = await trajetosService.obterTrajetos('Terminal Central', 'UNB');

      expect(opcao.duracaoMinutos).toBe(15);
      expect(opcao.etapas[0].duracaoMinutos).toBe(8);
      expect(opcao.etapas[2].duracaoMinutos).toBe(8);
    });

    it('nunca gera duração menor que 1 minuto (total e trechos)', async () => {
      trajetosRepository.buscarRotasComBaldeacao.mockResolvedValue([
        viagemComBaldeacao({ duracao_total: 0.4 }),
      ]);

      const [opcao] = await trajetosService.obterTrajetos('Terminal Central', 'UNB');

      expect(opcao.duracaoMinutos).toBe(1);
      expect(opcao.etapas[0].duracaoMinutos).toBe(1);
      expect(opcao.etapas[2].duracaoMinutos).toBe(1);
    });

    it('calcula o tempo de espera pela diferença entre saída e chegada na parada de transferência', async () => {
      trajetosRepository.buscarRotasComBaldeacao.mockResolvedValue([
        viagemComBaldeacao({ hora_chegada_transfer: '08:15:00', hora_saida_transfer: '08:42:00' }),
      ]);

      const [opcao] = await trajetosService.obterTrajetos('Terminal Central', 'UNB');

      expect(opcao.etapas[1].duracaoMinutos).toBe(27);
    });

    it.each([
      ['chegada e saída no mesmo horário', '08:20:00', '08:20:00'],
      ['saída anterior à chegada', '08:30:00', '08:20:00'],
    ])('usa espera mínima de 1 minuto quando há %s', async (_desc, chegada, saida) => {
      trajetosRepository.buscarRotasComBaldeacao.mockResolvedValue([
        viagemComBaldeacao({ hora_chegada_transfer: chegada, hora_saida_transfer: saida }),
      ]);

      const [opcao] = await trajetosService.obterTrajetos('Terminal Central', 'UNB');

      expect(opcao.etapas[1].duracaoMinutos).toBe(1);
    });
  });

  describe('combinação de resultados', () => {
    it('lista as rotas diretas antes das rotas com baldeação', async () => {
      trajetosRepository.buscarRotasDiretas.mockResolvedValue([
        viagemDireta({ horario_origem: '08:00:00' }),
        viagemDireta({ horario_origem: '09:00:00' }),
      ]);
      trajetosRepository.buscarRotasComBaldeacao.mockResolvedValue([
        viagemComBaldeacao({ hora_origem: '07:50:00' }),
      ]);

      const resultado = await trajetosService.obterTrajetos('Terminal Central', 'UNB');

      expect(resultado.map((o) => o.baldeacoes)).toEqual([0, 0, 1]);
      expect(resultado.map((o) => o.partida)).toEqual(['08:00:00', '09:00:00', '07:50:00']);
    });

    it('propaga erros do repositório', async () => {
      trajetosRepository.buscarRotasDiretas.mockRejectedValue(new Error('falha no banco'));

      await expect(trajetosService.obterTrajetos('Terminal Central', 'UNB')).rejects.toThrow(
        'falha no banco'
      );
    });
  });

  describe('ordenação e cálculo de caminhada (RF05)', () => {
    it('calcula caminhadaMetros quando a parada de embarque/desembarque difere da referência', async () => {
      mockParadas(
        [{ id: '1', nome: 'Parada A', latitude: -15.7939, longitude: -47.8828 }],
        [{ id: '2', nome: 'Parada B', latitude: -15.7801, longitude: -47.8792 }]
      );
      trajetosRepository.buscarRotasDiretas.mockResolvedValue([
        viagemDireta({
          origem_id: '10',
          lat_origem: -15.7957,
          lng_origem: -47.8828,
          destino_id: '2',
          lat_destino: -15.7801,
          lng_destino: -47.8792,
        }),
      ]);

      const [opcao] = await trajetosService.obterTrajetos('Parada A', 'Parada B');

      expect(opcao.caminhadaMetros).toBeGreaterThan(150);
      expect(opcao.caminhadaMetros).toBeLessThan(250);
    });

    it('ordena opções pelo critério TEMPO, BALDEACOES ou CAMINHADA', async () => {
      mockParadas(
        [{ id: '1', nome: 'Parada A', latitude: -15.7939, longitude: -47.8828 }],
        [{ id: '2', nome: 'Parada B', latitude: -15.7801, longitude: -47.8792 }]
      );
      trajetosRepository.buscarRotasDiretas.mockResolvedValue([
        viagemDireta({
          horario_origem: '08:00:00',
          duracao: 45,
          origem_id: '10',
          lat_origem: -15.7965,
          lng_origem: -47.8828,
          destino_id: '2',
          lat_destino: -15.7801,
          lng_destino: -47.8792,
        }),
      ]);
      trajetosRepository.buscarRotasComBaldeacao.mockResolvedValue([
        viagemComBaldeacao({
          hora_origem: '08:05:00',
          duracao_total: 25,
          origem_id: '1',
          lat_origem: -15.7939,
          lng_origem: -47.8828,
          destino_id: '2',
          lat_destino: -15.7801,
          lng_destino: -47.8792,
        }),
      ]);

      const porTempo = await trajetosService.obterTrajetos('Parada A', 'Parada B', 'TEMPO');
      expect(porTempo.map((o) => o.duracaoMinutos)).toEqual([25, 45]);

      mockParadas(
        [{ id: '1', nome: 'Parada A', latitude: -15.7939, longitude: -47.8828 }],
        [{ id: '2', nome: 'Parada B', latitude: -15.7801, longitude: -47.8792 }]
      );
      const porBaldeacoes = await trajetosService.obterTrajetos(
        'Parada A',
        'Parada B',
        'BALDEACOES'
      );
      expect(porBaldeacoes.map((o) => o.baldeacoes)).toEqual([0, 1]);

      mockParadas(
        [{ id: '1', nome: 'Parada A', latitude: -15.7939, longitude: -47.8828 }],
        [{ id: '2', nome: 'Parada B', latitude: -15.7801, longitude: -47.8792 }]
      );
      const porCaminhada = await trajetosService.obterTrajetos(
        'Parada A',
        'Parada B',
        'CAMINHADA'
      );
      expect(porCaminhada[0].caminhadaMetros).toBe(0);
      expect(porCaminhada[1].caminhadaMetros).toBeGreaterThan(200);
    });
  });
});
