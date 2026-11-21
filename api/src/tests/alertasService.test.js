jest.mock('../repositories/alertasRepository', () => ({
  findAlertasVigentes: jest.fn(),
  findAlertaVigenteById: jest.fn(),
  findAlertasVigentesPorItens: jest.fn(),
}));

const alertasRepository = require('../repositories/alertasRepository');
const alertasService = require('../services/alertasService');

describe('AlertasService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listarAlertasVigentes (RF13)', () => {
    it('retorna os alertas vigentes devolvidos pelo repositório', async () => {
      const alertas = [
        { id: 1, titulo: 'Desvio na Av. JK' },
        { id: 2, titulo: 'Linha 101 com atraso' },
      ];
      alertasRepository.findAlertasVigentes.mockResolvedValue(alertas);

      const resultado = await alertasService.listarAlertasVigentes();

      expect(resultado).toBe(alertas);
      expect(alertasRepository.findAlertasVigentes).toHaveBeenCalledTimes(1);
    });

    it('retorna lista vazia quando não há alertas vigentes', async () => {
      alertasRepository.findAlertasVigentes.mockResolvedValue([]);

      await expect(alertasService.listarAlertasVigentes()).resolves.toEqual([]);
    });

    it('propaga o erro do repositório', async () => {
      alertasRepository.findAlertasVigentes.mockRejectedValue(new Error('falha no banco'));

      await expect(alertasService.listarAlertasVigentes()).rejects.toThrow('falha no banco');
    });
  });

  describe('obterAlertaVigente (RF13)', () => {
    it('consulta o repositório pelo id e retorna o alerta', async () => {
      const alerta = { id: 7, titulo: 'Parada desativada' };
      alertasRepository.findAlertaVigenteById.mockResolvedValue(alerta);

      const resultado = await alertasService.obterAlertaVigente(7);

      expect(alertasRepository.findAlertaVigenteById).toHaveBeenCalledWith(7);
      expect(resultado).toBe(alerta);
    });

    it('retorna null quando o alerta não existe ou não está vigente', async () => {
      alertasRepository.findAlertaVigenteById.mockResolvedValue(null);

      await expect(alertasService.obterAlertaVigente(999)).resolves.toBeNull();
    });

    it('propaga o erro do repositório', async () => {
      alertasRepository.findAlertaVigenteById.mockRejectedValue(new Error('falha no banco'));

      await expect(alertasService.obterAlertaVigente(1)).rejects.toThrow('falha no banco');
    });
  });

  describe('vigentesPara (RF14)', () => {
    it('normaliza, remove duplicatas e consulta o repositório com linhas e paradas', async () => {
      const alertas = [{ id: 1, tipo: 'DESVIO' }];
      alertasRepository.findAlertasVigentesPorItens.mockResolvedValue(alertas);

      const resultado = await alertasService.vigentesPara(
        [' 0.346 ', '0.346', null, ''],
        [3368, '3368']
      );

      expect(alertasRepository.findAlertasVigentesPorItens).toHaveBeenCalledWith(
        ['0.346'],
        ['3368']
      );
      expect(resultado).toBe(alertas);
    });

    it('retorna lista vazia sem consultar o repositório quando nenhum item válido é informado', async () => {
      const resultado = await alertasService.vigentesPara([], [null, '']);

      expect(resultado).toEqual([]);
      expect(alertasRepository.findAlertasVigentesPorItens).not.toHaveBeenCalled();
    });
  });

  describe('filtrarAlertasParaItens (RF14)', () => {
    const alertas = [
      {
        id: 1,
        tipo: 'DESVIO',
        linhas_afetadas: [{ id: '0.346', codigo: '0.346', nome: 'QNR 5' }],
        paradas_afetadas: [],
      },
      {
        id: 2,
        tipo: 'SUSPENSAO',
        linhas_afetadas: [],
        paradas_afetadas: [{ id: '3368', codigo: 'P-3368', nome: 'Rodoviária do Plano Piloto' }],
      },
    ];

    it('retorna alertas que afetam a linha informada por id ou código', () => {
      const resultado = alertasService.filtrarAlertasParaItens(alertas, { linhasIds: ['0.346'] });

      expect(resultado).toEqual([alertas[0]]);
    });

    it('retorna alertas que afetam a parada por id, código ou nome (case-insensitive)', () => {
      expect(
        alertasService.filtrarAlertasParaItens(alertas, { paradasIds: ['3368'] })
      ).toEqual([alertas[1]]);
      expect(
        alertasService.filtrarAlertasParaItens(alertas, {
          paradasNomes: ['rodoviária do plano piloto'],
        })
      ).toEqual([alertas[1]]);
    });

    it('retorna lista vazia quando nenhum alerta corresponde ou lista de alertas é vazia', () => {
      expect(
        alertasService.filtrarAlertasParaItens(alertas, { linhasIds: ['9.999'] })
      ).toEqual([]);
      expect(alertasService.filtrarAlertasParaItens([], { linhasIds: ['0.346'] })).toEqual([]);
      expect(alertasService.filtrarAlertasParaItens(alertas, {})).toEqual([]);
    });
  });

  describe('extrairItensDoTrajeto (RF14)', () => {
    it('extrai códigos de linhas e nomes de paradas das instruções das etapas', () => {
      const opcao = {
        etapas: [
          {
            ordem: 1,
            tipo: 'ONIBUS',
            instrucao: 'Embarque na linha 0.346 em "Terminal Gama" e desça em "Rodoviária" após 5 paradas.',
          },
          {
            ordem: 2,
            tipo: 'CAMINHADA',
            instrucao: 'Faça a baldeação na parada "Rodoviária". Aguarde o próximo ônibus.',
          },
          {
            ordem: 3,
            tipo: 'ONIBUS',
            instrucao: 'Embarque na linha 0.110 e desça em "UNB" após 3 paradas.',
          },
        ],
      };

      const itens = alertasService.extrairItensDoTrajeto(opcao);

      expect(itens).toEqual({
        linhasIds: ['0.346', '0.110'],
        paradasIds: [],
        paradasNomes: ['Terminal Gama', 'Rodoviária', 'UNB'],
      });
    });

    it('retorna listas vazias quando a opção não tem etapas', () => {
      expect(alertasService.extrairItensDoTrajeto(null)).toEqual({
        linhasIds: [],
        paradasIds: [],
        paradasNomes: [],
      });
    });
  });
});
