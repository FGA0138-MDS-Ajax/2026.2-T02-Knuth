import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AdminScreen from '../screens/AdminScreen';
import { getPerfilAdmin } from '../services/api';


jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../services/api', () => ({
  getPerfilAdmin: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (effect) => {
      React.useEffect(effect, [effect]);
    },
  };
});


const TOKEN_KEY = '@rotasdf_token';
const USUARIO_KEY = '@rotasdf_usuario';

function mockStorage(valores) {
  AsyncStorage.getItem.mockImplementation(async (chave) => valores[chave] ?? null);
}

// ---------- Testes ----------

describe('AdminScreen', () => {
  const navigation = { navigate: jest.fn() };

  const renderTela = () => render(<AdminScreen navigation={navigation} />);

  // Deixa a tela no estado "liberado" (token válido + usuário salvo).
  const renderLiberada = async () => {
    mockStorage({
      [TOKEN_KEY]: 'token-admin',
      [USUARIO_KEY]: JSON.stringify({ nome: 'Maria' }),
    });
    getPerfilAdmin.mockResolvedValue({});
    const tela = renderTela();
    await tela.findByText('Área do Administrador');
    return tela;
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('verificação de acesso', () => {
    it('mostra o indicador de carregamento enquanto verifica o acesso', () => {
      AsyncStorage.getItem.mockReturnValue(new Promise(() => {})); 
      const { UNSAFE_getByType, queryByText } = renderTela();

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
      expect(queryByText('Acesso restrito')).toBeNull();
      expect(queryByText('Área do Administrador')).toBeNull();
    });

    it('nega o acesso quando não há token salvo', async () => {
      mockStorage({});
      const { findByText } = renderTela();

      expect(await findByText('Acesso restrito')).toBeTruthy();
      expect(getPerfilAdmin).not.toHaveBeenCalled();
    });

    it('nega o acesso quando a API recusa o token (usuário não é admin)', async () => {
      mockStorage({ [TOKEN_KEY]: 'token-comum' });
      getPerfilAdmin.mockRejectedValue(new Error('403'));
      const { findByText } = renderTela();

      expect(await findByText('Acesso restrito')).toBeTruthy();
      expect(getPerfilAdmin).toHaveBeenCalledWith('token-comum');
    });

    it('libera o acesso e mostra o nome do admin quando o token é válido', async () => {
      mockStorage({
        [TOKEN_KEY]: 'token-admin',
        [USUARIO_KEY]: JSON.stringify({ nome: 'Maria' }),
      });
      getPerfilAdmin.mockResolvedValue({});
      const { findByText, getByText } = renderTela();

      expect(await findByText('Área do Administrador')).toBeTruthy();
      expect(getPerfilAdmin).toHaveBeenCalledWith('token-admin');
      expect(getByText(/Olá, Maria\./)).toBeTruthy();
    });

    it('libera o acesso mesmo sem usuário salvo, sem quebrar a tela', async () => {
      mockStorage({ [TOKEN_KEY]: 'token-admin' });
      getPerfilAdmin.mockResolvedValue({});
      const { findByText, getByText } = renderTela();

      expect(await findByText('Área do Administrador')).toBeTruthy();
      expect(getByText(/Seu acesso de administrador está liberado/)).toBeTruthy();
    });
  });

  describe('navegação', () => {
    it('no acesso restrito, o botão "Entrar" leva para a tela de Login', async () => {
      mockStorage({});
      const { findByText, getByText } = renderTela();
      await findByText('Acesso restrito');

      fireEvent.press(getByText('Entrar'));

      expect(navigation.navigate).toHaveBeenCalledWith('Login');
    });

    it('"Cadastrar administrador" leva para a tela CriarAdmin', async () => {
      const { getByText } = await renderLiberada();

      fireEvent.press(getByText('Cadastrar administrador'));

      expect(navigation.navigate).toHaveBeenCalledWith('CriarAdmin');
    });

    it('"Gerenciar usuários" leva para a tela GerenciarUsuarios', async () => {
      const { getByText } = await renderLiberada();

      fireEvent.press(getByText('Gerenciar usuários'));

      expect(navigation.navigate).toHaveBeenCalledWith('GerenciarUsuarios');
    });
  });

  describe('logout', () => {
    it('ao sair, remove token e usuário e volta para o acesso restrito', async () => {
      const { getByText, findByText, queryByText } = await renderLiberada();

      fireEvent.press(getByText('Sair'));

      expect(await findByText('Acesso restrito')).toBeTruthy();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(USUARIO_KEY);
      expect(queryByText('Área do Administrador')).toBeNull();
    });
  });
});