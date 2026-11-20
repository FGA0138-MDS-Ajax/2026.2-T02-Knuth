import React from 'react';
import { Alert, Platform } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ConfiguracoesScreen from '../src/screens/ConfiguracoesScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
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
const HISTORICO_KEY = '@rotasdf_buscas_recentes';
const USUARIO = { nome: 'Maria Silva', email: 'maria@email.com' };

function mockStorage(valores) {
  AsyncStorage.getItem.mockImplementation(async (chave) => valores[chave] ?? null);
}

const descritorOriginalDoOS = Object.getOwnPropertyDescriptor(Platform, 'OS');
function definirPlataforma(os) {
  Object.defineProperty(Platform, 'OS', { configurable: true, enumerable: true, get: () => os });
}

// ---------- Testes ----------

describe('ConfiguracoesScreen', () => {
  const navigation = { navigate: jest.fn() };
  const alertOriginal = window.alert;
  const confirmOriginal = window.confirm;
  let alertSpy;
  let erroSpy;

  const renderTela = async () => {
    const tela = render(<ConfiguracoesScreen navigation={navigation} />);
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith(USUARIO_KEY));
    return tela;
  };

  // Renderiza a tela já com o usuário logado carregado do AsyncStorage.
  const renderLogado = async () => {
    mockStorage({ [USUARIO_KEY]: JSON.stringify(USUARIO) });
    const tela = await renderTela();
    await tela.findByText(USUARIO.nome);
    return tela;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockStorage({});
    definirPlataforma('ios');
    window.alert = jest.fn();
    window.confirm = jest.fn();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
    erroSpy.mockRestore();
    window.alert = alertOriginal;
    window.confirm = confirmOriginal;
    Object.defineProperty(Platform, 'OS', descritorOriginalDoOS);
  });

  describe('perfil', () => {
    it('mostra "Passageiro Anônimo" e o botão de login quando não há usuário salvo', async () => {
      const { getByText, queryByText } = await renderTela();

      expect(getByText('Passageiro Anônimo')).toBeTruthy();
      expect(getByText('Você não está logado')).toBeTruthy();
      expect(getByText('Fazer Login')).toBeTruthy();
      expect(queryByText('Sair da conta')).toBeNull();
    });

    it('"Fazer Login" leva para a tela de Login', async () => {
      const { getByText } = await renderTela();

      fireEvent.press(getByText('Fazer Login'));

      expect(navigation.navigate).toHaveBeenCalledWith('Login');
    });

    it('mostra nome e e-mail do usuário logado e a opção de sair', async () => {
      const { getByText, queryByText } = await renderLogado();

      expect(getByText(USUARIO.nome)).toBeTruthy();
      expect(getByText(USUARIO.email)).toBeTruthy();
      expect(getByText('Sair da conta')).toBeTruthy();
      expect(queryByText('Passageiro Anônimo')).toBeNull();
      expect(queryByText('Fazer Login')).toBeNull();
    });
  });

  describe('opções de navegação', () => {
    it('"Alertas de serviço" leva para a tela de Alertas', async () => {
      const { getByText } = await renderTela();

      fireEvent.press(getByText('Alertas de serviço'));

      expect(navigation.navigate).toHaveBeenCalledWith('Alertas');
    });

    it('"Área do administrador" leva para a tela Admin', async () => {
      const { getByText } = await renderTela();

      fireEvent.press(getByText('Área do administrador'));

      expect(navigation.navigate).toHaveBeenCalledWith('Admin');
    });
  });

  describe('limpar histórico de buscas', () => {
    it('remove o histórico e avisa com Alert no celular', async () => {
      const { getByText } = await renderTela();

      fireEvent.press(getByText('Limpar histórico de buscas'));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Histórico de buscas limpo!')
      );
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(HISTORICO_KEY);
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('remove o histórico e avisa com window.alert na web', async () => {
      definirPlataforma('web');
      const { getByText } = await renderTela();

      fireEvent.press(getByText('Limpar histórico de buscas'));

      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Histórico de buscas limpo!'));
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(HISTORICO_KEY);
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('registra o erro e não avisa sucesso quando a remoção falha', async () => {
      AsyncStorage.removeItem.mockRejectedValue(new Error('falha no storage'));
      const { getByText } = await renderTela();

      fireEvent.press(getByText('Limpar histórico de buscas'));

      await waitFor(() => expect(erroSpy).toHaveBeenCalledWith(expect.any(Error)));
      expect(alertSpy).not.toHaveBeenCalled();
      expect(window.alert).not.toHaveBeenCalled();
    });
  });

  describe('sair da conta (celular)', () => {
    it('pede confirmação com os botões "Cancelar" e "Sair"', async () => {
      const { getByText } = await renderLogado();

      fireEvent.press(getByText('Sair da conta'));

      expect(alertSpy).toHaveBeenCalledWith('Sair', 'Deseja realmente sair da conta?', [
        expect.objectContaining({ text: 'Cancelar', style: 'cancel' }),
        expect.objectContaining({
          text: 'Sair',
          style: 'destructive',
          onPress: expect.any(Function),
        }),
      ]);
    });

    it('não desloga enquanto o usuário não confirma', async () => {
      const { getByText } = await renderLogado();

      fireEvent.press(getByText('Sair da conta'));

      const botoes = alertSpy.mock.calls[0][2];
      expect(botoes.find((b) => b.text === 'Cancelar').onPress).toBeUndefined();
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
      expect(navigation.navigate).not.toHaveBeenCalled();
      expect(getByText(USUARIO.nome)).toBeTruthy();
    });

    it('ao confirmar, limpa token e usuário, vai para Linhas e volta ao estado anônimo', async () => {
      const { getByText, findByText } = await renderLogado();
      fireEvent.press(getByText('Sair da conta'));

      const botaoSair = alertSpy.mock.calls[0][2].find((b) => b.text === 'Sair');
      await act(async () => {
        await botaoSair.onPress();
      });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(USUARIO_KEY);
      expect(navigation.navigate).toHaveBeenCalledWith('Linhas');
      expect(await findByText('Passageiro Anônimo')).toBeTruthy();
    });
  });

  describe('sair da conta (web)', () => {
    beforeEach(() => {
      definirPlataforma('web');
    });

    it('ao confirmar no window.confirm, desloga e vai para Linhas', async () => {
      window.confirm.mockReturnValue(true);
      const { getByText, findByText } = await renderLogado();

      fireEvent.press(getByText('Sair da conta'));

      await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('Linhas'));
      expect(window.confirm).toHaveBeenCalledWith('Deseja realmente sair da conta?');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(USUARIO_KEY);
      expect(alertSpy).not.toHaveBeenCalled();
      expect(await findByText('Passageiro Anônimo')).toBeTruthy();
    });

    it('ao cancelar no window.confirm, não desloga', async () => {
      window.confirm.mockReturnValue(false);
      const { getByText } = await renderLogado();

      fireEvent.press(getByText('Sair da conta'));

      expect(window.confirm).toHaveBeenCalledWith('Deseja realmente sair da conta?');
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
      expect(navigation.navigate).not.toHaveBeenCalled();
      expect(getByText(USUARIO.nome)).toBeTruthy();
    });
  });
});