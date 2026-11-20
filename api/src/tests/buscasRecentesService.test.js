jest.mock('../repositories/buscasRecentesRepository', () => ({
  salvarBusca: jest.fn(),
  listarBuscasRecentes: jest.fn(),
}));

const buscasRecentesRepository = require('../repositories/buscasRecentesRepository');
const buscasRecentesService = require('../services/buscasRecentesService');

describe('BuscasRecentesService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('registrarBusca', () => {
    it.each([
      ['origem', undefined, 'UNB'],
      ['origem', '', 'UNB'],
      ['destino', 'Terminal', undefined],
      ['destino', 'Terminal', ''],
    ])('lança erro quando %s não é informado', async (_campo, origem, destino) => {
      await expect(buscasRecentesService.registrarBusca(origem, destino)).rejects.toThrow(
        'Origem e destino são obrigatórios.'
      );
      expect(buscasRecentesRepository.salvarBusca).not.toHaveBeenCalled();
    });

    it('remove espaços extras de origem e destino antes de salvar', async () => {
      buscasRecentesRepository.salvarBusca.mockResolvedValue({ id: 1 });

      await buscasRecentesService.registrarBusca('  Terminal Central  ', ' UNB ', 5);

      expect(buscasRecentesRepository.salvarBusca).toHaveBeenCalledWith('Terminal Central', 'UNB', 5);
    });

    it('salva com usuarioId nulo quando o usuário não está logado', async () => {
      buscasRecentesRepository.salvarBusca.mockResolvedValue({ id: 2 });

      await buscasRecentesService.registrarBusca('A', 'B');

      expect(buscasRecentesRepository.salvarBusca).toHaveBeenCalledWith('A', 'B', null);
    });

    it('retorna o registro criado pelo repositório', async () => {
      const registro = { id: 3, origem: 'A', destino: 'B' };
      buscasRecentesRepository.salvarBusca.mockResolvedValue(registro);

      await expect(buscasRecentesService.registrarBusca('A', 'B', 1)).resolves.toBe(registro);
    });
  });

  describe('obterBuscasRecentes', () => {
    it('usa usuarioId nulo e limite 5 por padrão', async () => {
      buscasRecentesRepository.listarBuscasRecentes.mockResolvedValue([]);

      await buscasRecentesService.obterBuscasRecentes();

      expect(buscasRecentesRepository.listarBuscasRecentes).toHaveBeenCalledWith(null, 5);
    });

    it('repassa usuarioId e limite informados', async () => {
      const buscas = [{ id: 1 }, { id: 2 }, { id: 3 }];
      buscasRecentesRepository.listarBuscasRecentes.mockResolvedValue(buscas);

      const resultado = await buscasRecentesService.obterBuscasRecentes(9, 3);

      expect(buscasRecentesRepository.listarBuscasRecentes).toHaveBeenCalledWith(9, 3);
      expect(resultado).toBe(buscas);
    });

    it.each([
      [10, 10],
      ['10', 10],
      ['abc', 5],
      [0, 5],
      [null, 5],
    ])('converte o limite %p para %p', async (limite, esperado) => {
      buscasRecentesRepository.listarBuscasRecentes.mockResolvedValue([]);

      await buscasRecentesService.obterBuscasRecentes(1, limite);

      expect(buscasRecentesRepository.listarBuscasRecentes).toHaveBeenCalledWith(1, esperado);
    });
  });
});
