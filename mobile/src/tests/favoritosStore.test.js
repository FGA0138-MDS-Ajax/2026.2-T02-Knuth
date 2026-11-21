import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFavoritos, adicionarFavorito, removerFavorito } from '../services/api';
import { criarFavoritosStore } from '../utils/favoritosStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn() },
}));

jest.mock('../services/api', () => ({
  getFavoritos: jest.fn(),
  adicionarFavorito: jest.fn(),
  removerFavorito: jest.fn(),
}));

const PASSAGEIRO = JSON.stringify({ id: 3, tipo: 'PASSAGEIRO' });
const ADMIN = JSON.stringify({ id: 1, tipo: 'ADMIN' });
const FAVORITO_LINHA = { id: 5, tipo: 'LINHA', linhaId: '0.782' };

const sessao = (token, usuario) => {
  AsyncStorage.getItem.mockImplementation(async (chave) => {
    if (chave === '@rotasdf_token') return token;
    if (chave === '@rotasdf_usuario') return usuario;
    return null;
  });
};

describe('favoritosStore', () => {
  let store;

  beforeEach(() => {
    jest.resetAllMocks();
    store = criarFavoritosStore();
  });

  describe('carregar', () => {
    it('começa sem login e sem favoritos', () => {
      expect(store.obter()).toEqual({ logado: false, favoritos: [] });
    });

    it('não consulta a API quando não há login', async () => {
      sessao(null, null);

      await store.carregar();

      expect(getFavoritos).not.toHaveBeenCalled();
      expect(store.obter()).toEqual({ logado: false, favoritos: [] });
    });

    it('não consulta a API para o administrador', async () => {
      sessao('tk', ADMIN);

      await store.carregar();

      expect(getFavoritos).not.toHaveBeenCalled();
      expect(store.obter().logado).toBe(false);
    });

    it('carrega os favoritos do passageiro logado', async () => {
      sessao('tk', PASSAGEIRO);
      getFavoritos.mockResolvedValue([FAVORITO_LINHA]);

      await store.carregar();

      expect(getFavoritos).toHaveBeenCalledWith('tk');
      expect(store.obter()).toEqual({ logado: true, favoritos: [FAVORITO_LINHA] });
    });

    it('mantém a lista vazia quando a API falha', async () => {
      sessao('tk', PASSAGEIRO);
      getFavoritos.mockRejectedValue(new Error('falha'));

      await store.carregar();

      expect(store.obter()).toEqual({ logado: true, favoritos: [] });
    });

    it('esvazia a lista quando o usuário sai da conta', async () => {
      sessao('tk', PASSAGEIRO);
      getFavoritos.mockResolvedValue([FAVORITO_LINHA]);
      await store.carregar();

      sessao(null, null);
      await store.carregar();

      expect(store.obter()).toEqual({ logado: false, favoritos: [] });
    });
  });

  describe('inscrever', () => {
    it('avisa os inscritos quando a lista muda e para depois de cancelar', async () => {
      sessao('tk', PASSAGEIRO);
      getFavoritos.mockResolvedValue([FAVORITO_LINHA]);
      const aviso = jest.fn();

      const cancelar = store.inscrever(aviso);
      await store.carregar();
      expect(aviso).toHaveBeenCalled();

      aviso.mockClear();
      cancelar();
      await store.carregar();
      expect(aviso).not.toHaveBeenCalled();
    });
  });

  describe('buscar', () => {
    it('encontra favoritos de linha, parada e trajeto', async () => {
      const lista = [
        FAVORITO_LINHA,
        { id: 6, tipo: 'PARADA', paradaId: 'P1' },
        { id: 7, tipo: 'TRAJETO', origem: 'Asa Sul', destino: 'Rodoviária' },
      ];
      sessao('tk', PASSAGEIRO);
      getFavoritos.mockResolvedValue(lista);
      await store.carregar();

      expect(store.buscar({ tipo: 'LINHA', linhaId: '0.782' })).toEqual(lista[0]);
      expect(store.buscar({ tipo: 'PARADA', paradaId: 'P1' })).toEqual(lista[1]);
      expect(store.buscar({ tipo: 'TRAJETO', origem: 'Asa Sul', destino: 'Rodoviária' })).toEqual(lista[2]);
      expect(store.buscar({ tipo: 'LINHA', linhaId: 'outra' })).toBeUndefined();
    });
  });

  describe('alternar', () => {
    it('salva o favorito quando ele ainda não existe', async () => {
      sessao('tk', PASSAGEIRO);
      getFavoritos.mockResolvedValue([]);
      adicionarFavorito.mockResolvedValue(FAVORITO_LINHA);
      await store.carregar();

      await store.alternar({ tipo: 'LINHA', linhaId: '0.782' });

      expect(adicionarFavorito).toHaveBeenCalledWith('tk', { tipo: 'LINHA', linhaId: '0.782' });
      expect(store.obter().favoritos).toEqual([FAVORITO_LINHA]);
    });

    it('remove o favorito quando ele já existe', async () => {
      sessao('tk', PASSAGEIRO);
      getFavoritos.mockResolvedValue([FAVORITO_LINHA]);
      removerFavorito.mockResolvedValue({});
      await store.carregar();

      await store.alternar({ tipo: 'LINHA', linhaId: '0.782' });

      expect(removerFavorito).toHaveBeenCalledWith('tk', 5);
      expect(store.obter().favoritos).toEqual([]);
    });

    it('recusa quando não há login', async () => {
      sessao(null, null);
      await store.carregar();

      await expect(store.alternar({ tipo: 'LINHA', linhaId: '0.782' })).rejects.toThrow(
        'Entre na sua conta para usar favoritos.'
      );
      expect(adicionarFavorito).not.toHaveBeenCalled();
    });

    it('propaga o erro da API sem alterar a lista', async () => {
      sessao('tk', PASSAGEIRO);
      getFavoritos.mockResolvedValue([]);
      adicionarFavorito.mockRejectedValue(new Error('falha'));
      await store.carregar();

      await expect(store.alternar({ tipo: 'LINHA', linhaId: '0.782' })).rejects.toThrow('falha');
      expect(store.obter().favoritos).toEqual([]);
    });
  });
});