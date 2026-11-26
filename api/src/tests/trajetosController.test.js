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
      const opcoes = [
        { duracaoMinutos: 25, baldeacoes: 0 },
      ];

      const alerta = {
        id: 1,
        tipo: 'DESVIO',
        descricao: 'Desvio na W3',
      };

      trajetosService.obterTrajetos.mockResolvedValue(opcoes);
      alertasService.listarAlertasVigentes.mockResolvedValue([alerta]);
      alertasService.filtrarAlertasParaItens.mockReturnValue([alerta]);

      const res = criarRes();

      await trajetosController.getTrajetos(
        {
          query: {
            origem: 'Asa Sul',
            destino: 'Rodoviária',
          },
        },
        res
      );

      expect(trajetosService.obterTrajetos).toHaveBeenCalledWith(
        'Asa Sul',
        'Rodoviária',
        null,
        null
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith([
        {
          duracaoMinutos: 25,
          baldeacoes: 0,
          afetadaPorAlerta: true,
          alertas: [alerta],
        },
      ]);
    });

    it('mantém a resposta 200 sem alertas quando a consulta de alertas falha', async () => {
      const opcoes = [
        { duracaoMinutos: 25, baldeacoes: 0 },
      ];

      trajetosService.obterTrajetos.mockResolvedValue(opcoes);

      alertasService.listarAlertasVigentes.mockRejectedValue(
        new Error('erro alertas')
      );

      const res = criarRes();

      await trajetosController.getTrajetos(
        {
          query: {
            origem: 'Asa Sul',
            destino: 'Rodoviária',
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith([
        {
          duracaoMinutos: 25,
          baldeacoes: 0,
          afetadaPorAlerta: false,
          alertas: [],
        },
      ]);
    });

    it('responde 200 com lista vazia quando não há rotas', async () => {
      trajetosService.obterTrajetos.mockResolvedValue([]);

      const res = criarRes();

      await trajetosController.getTrajetos(
        {
          query: {
            origem: 'Asa Sul',
            destino: 'Lugar Nenhum',
          },
        },
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
        {
          query: {
            origem: 'Asa Sul',
            destino: 'Rodoviária',
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao calcular trajetos.',
      });

      expect(erroSpy).toHaveBeenCalledWith(
        'Erro na busca de trajetos:',
        erro
      );
    });

    // RF05 - Ordenação de trajetos

    it.each([
      ['tempo', 'TEMPO'],
      ['baldeacoes', 'BALDEACOES'],
      ['caminhada', 'CAMINHADA'],
    ])(
      'repassa ordenarPor %s normalizado para %s (RF05)',
      async (ordenarPor, criterioEsperado) => {
        const opcoes = [
          {
            duracaoMinutos: 20,
            baldeacoes: 0,
            caminhadaMetros: 0,
          },
        ];

        trajetosService.obterTrajetos.mockResolvedValue(opcoes);

        const res = criarRes();

        await trajetosController.getTrajetos(
          {
            query: {
              origem: 'Asa Sul',
              destino: 'Rodoviária',
              ordenarPor,
            },
          },
          res
        );

        expect(trajetosService.obterTrajetos).toHaveBeenCalledWith(
          'Asa Sul',
          'Rodoviária',
          criterioEsperado,
          null
        );

        expect(res.status).toHaveBeenCalledWith(200);
      }
    );

    it('responde 400 quando ordenarPor é inválido (RF05)', async () => {
      const res = criarRes();

      await trajetosController.getTrajetos(
        {
          query: {
            origem: 'Asa Sul',
            destino: 'Rodoviária',
            ordenarPor: 'tarifa',
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes:
          'Parâmetro ordenarPor inválido. Use TEMPO, BALDEACOES ou CAMINHADA.',
      });

      expect(trajetosService.obterTrajetos).not.toHaveBeenCalled();
    });

    // RF06 - Planejamento por horário

    it.each([
      ['partida', 'PARTIDA'],
      ['chegada', 'CHEGADA'],
    ])(
      'repassa filtro de horário de %s ao serviço quando válido (RF06)',
      async (referenciaHorario, referenciaEsperada) => {
        const opcoes = [
          {
            duracaoMinutos: 20,
            partida: '08:30:00',
            chegada: '08:50:00',
            baldeacoes: 0,
          },
        ];

        trajetosService.obterTrajetos.mockResolvedValue(opcoes);

        const res = criarRes();

        await trajetosController.getTrajetos(
          {
            query: {
              origem: 'Asa Sul',
              destino: 'Rodoviária',
              horario: '09:00',
              referenciaHorario,
            },
          },
          res
        );

        expect(trajetosService.obterTrajetos).toHaveBeenCalledWith(
          'Asa Sul',
          'Rodoviária',
          null,
          {
            referencia: referenciaEsperada,
            horario: '09:00:00',
          }
        );

        expect(res.status).toHaveBeenCalledWith(200);
      }
    );

    it.each([
      [
        {
          origem: 'Asa Sul',
          destino: 'Rodoviária',
          horario: '25:99',
        },
        'Parâmetro horario inválido. Use o formato HH:MM (ex.: 08:30).',
      ],
      [
        {
          origem: 'Asa Sul',
          destino: 'Rodoviária',
          horario: '08:00',
          referenciaHorario: 'OUTRO',
        },
        'Parâmetro referenciaHorario inválido. Use PARTIDA ou CHEGADA.',
      ],
      [
        {
          origem: 'Asa Sul',
          destino: 'Rodoviária',
          referenciaHorario: 'CHEGADA',
        },
        'Informe o parâmetro horario (HH:MM) junto com referenciaHorario.',
      ],
    ])(
      'responde 400 quando o filtro de horário é inválido (%j)',
      async (query, detalhes) => {
        const res = criarRes();

        await trajetosController.getTrajetos({ query }, res);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
          erro: 'BAD_REQUEST',
          detalhes,
        });

        expect(trajetosService.obterTrajetos).not.toHaveBeenCalled();
      }
    );

    // Integração entre RF05 e RF06 no controller

    it('repassa simultaneamente o critério de ordenação e o filtro de horário (RF05 e RF06)', async () => {
      const opcoes = [
        {
          duracaoMinutos: 20,
          partida: '08:30:00',
          chegada: '08:50:00',
          baldeacoes: 0,
          caminhadaMetros: 0,
        },
      ];

      trajetosService.obterTrajetos.mockResolvedValue(opcoes);

      const res = criarRes();

      await trajetosController.getTrajetos(
        {
          query: {
            origem: 'Asa Sul',
            destino: 'Rodoviária',
            ordenarPor: 'tempo',
            horario: '09:00',
            referenciaHorario: 'chegada',
          },
        },
        res
      );

      expect(trajetosService.obterTrajetos).toHaveBeenCalledWith(
        'Asa Sul',
        'Rodoviária',
        'TEMPO',
        {
          referencia: 'CHEGADA',
          horario: '09:00:00',
        }
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith([
        {
          ...opcoes[0],
          afetadaPorAlerta: false,
          alertas: [],
        },
      ]);
    });
  });
});