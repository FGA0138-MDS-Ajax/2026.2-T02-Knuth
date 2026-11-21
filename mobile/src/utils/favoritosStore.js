import { getFavoritos, adicionarFavorito, removerFavorito } from '../services/api';

const MENSAGEM_SEM_LOGIN = 'Entre na sua conta para usar favoritos.';

const mesmoItem = (a, b) => {
  if (a.tipo !== b.tipo) return false;
  if (a.tipo === 'LINHA') return String(a.linhaId) === String(b.linhaId);
  if (a.tipo === 'PARADA') return String(a.paradaId) === String(b.paradaId);
  return a.origem === b.origem && a.destino === b.destino;
};

export function criarFavoritosStore() {
  let estado = { logado: false, favoritos: [] };
  let token = null;
  const inscritos = new Set();

  const atualizar = (novoEstado) => {
    estado = novoEstado;
    inscritos.forEach((aviso) => aviso());
  };

  const lerSessao = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const tokenSalvo = await AsyncStorage.getItem('@rotasdf_token');
      const usuarioSalvo = await AsyncStorage.getItem('@rotasdf_usuario');
      const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
      if (tokenSalvo && usuario && usuario.tipo === 'PASSAGEIRO') {
        return tokenSalvo;
      }
    } catch (erro) {
      return null;
    }
    return null;
  };

  const carregar = async () => {
    token = await lerSessao();
    if (!token) {
      atualizar({ logado: false, favoritos: [] });
      return;
    }
    try {
      const favoritos = await getFavoritos(token);
      atualizar({ logado: true, favoritos });
    } catch (erro) {
      atualizar({ logado: true, favoritos: [] });
    }
  };

  const buscar = (item) => estado.favoritos.find((favorito) => mesmoItem(favorito, item));

  const alternar = async (item) => {
    if (!token) {
      throw new Error(MENSAGEM_SEM_LOGIN);
    }
    const existente = buscar(item);
    if (existente) {
      await removerFavorito(token, existente.id);
      atualizar({ ...estado, favoritos: estado.favoritos.filter((favorito) => favorito.id !== existente.id) });
      return;
    }
    const criado = await adicionarFavorito(token, item);
    atualizar({ ...estado, favoritos: [criado, ...estado.favoritos] });
  };

  const inscrever = (aviso) => {
    inscritos.add(aviso);
    return () => inscritos.delete(aviso);
  };

  return { obter: () => estado, carregar, buscar, alternar, inscrever };
}

export const favoritosStore = criarFavoritosStore();