import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CHAVE_BUSCAS_RECENTES,
  carregarHistorico,
  listarTrajetosRecentes,
  listarLinhasRecentes,
  salvarTrajetoRecenteLocal,
  salvarLinhaRecenteLocal,
  mesclarTrajetosRecentes,
  obterUsuarioLogadoId,
} from '../utils/buscasRecentesStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('buscasRecentesStorage (RF18)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('retorna listas vazias quando não há histórico salvo', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    await expect(carregarHistorico()).resolves.toEqual({ trajetos: [], linhas: [] });
    await expect(listarTrajetosRecentes()).resolves.toEqual([]);
    await expect(listarLinhasRecentes()).resolves.toEqual([]);
  });

  it('salva trajetos recentes da mais recente para a mais antiga sem duplicar', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        JSON.stringify({
          trajetos: [{ origem: 'UnB', destino: 'Rodoviária', realizadaEm: '2026-11-21T10:00:00Z' }],
          linhas: [],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          trajetos: [
            { origem: 'Taguatinga', destino: 'W3 Norte', realizadaEm: '2026-11-21T11:00:00Z' },
            { origem: 'UnB', destino: 'Rodoviária', realizadaEm: '2026-11-21T10:00:00Z' },
          ],
          linhas: [],
        })
      );

    await salvarTrajetoRecenteLocal('UnB', 'Rodoviária');
    await salvarTrajetoRecenteLocal('Taguatinga', 'W3 Norte');
    const final = await salvarTrajetoRecenteLocal('unb', 'rodoviária');

    expect(final.map((t) => `${t.origem}->${t.destino}`)).toEqual([
      'unb->rodoviária',
      'Taguatinga->W3 Norte',
    ]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(CHAVE_BUSCAS_RECENTES, expect.any(String));
  });

  it('salva linhas recentes em ordem decrescente de uso e limita a 5 itens', async () => {
    const iniciais = [1, 2, 3, 4, 5].map((n) => ({
      termo: `0.${n}00`,
      linhaId: String(n),
      codigo: `0.${n}00`,
      nome: `Linha ${n}`,
    }));
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ trajetos: [], linhas: iniciais }));

    const atualizadas = await salvarLinhaRecenteLocal({
      termo: '0.600',
      linhaId: '6',
      codigo: '0.600',
      nome: 'Linha 6',
    });

    expect(atualizadas).toHaveLength(5);
    expect(atualizadas[0].codigo).toBe('0.600');
    expect(atualizadas[4].codigo).toBe('0.400');
  });

  it('mescla trajetos locais e remotos sem duplicatas respeitando o limite', () => {
    const mesclados = mesclarTrajetosRecentes(
      [{ origem: 'UnB', destino: 'Rodoviária' }],
      [
        { origem: 'unb', destino: 'rodoviária' },
        { origem: 'Taguatinga', destino: 'Asa Sul' },
      ],
      5
    );

    expect(mesclados).toHaveLength(2);
    expect(mesclados[0].origem).toBe('UnB');
    expect(mesclados[1].origem).toBe('Taguatinga');
  });

  it('lê o id do usuário logado do AsyncStorage ou devolve null', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ id: 7, nome: 'Passageiro' }));
    await expect(obterUsuarioLogadoId()).resolves.toBe(7);

    AsyncStorage.getItem.mockResolvedValueOnce(null);
    await expect(obterUsuarioLogadoId()).resolves.toBeNull();
  });
});
