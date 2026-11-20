import React from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../src/screens/LoginScreen';
import { loginUsuario } from '../src/services/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../src/services/api', () => ({
  loginUsuario: jest.fn(),
}));

const CREDENCIAIS = { email: 'maria@email.com', senha: 'senha123' };
const RESPOSTA = {
  token: 'token-abc',
  usuario: { id: 1, nome: 'Maria Silva', email: 'maria@email.com', tipo: 'PASSAGEIRO' },
};
const MSG_PADRAO = 'Email ou senha incorretos.';

// -----testes------
describe('LoginScreen', () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  let alertSpy;

  const renderTela = () => render(<LoginScreen navigation={navigation} />);

  const preencher = (tela, { email, senha }) => {
    if (email !== undefined) fireEvent.changeText(tela.getByPlaceholderText('E-mail'), email);
    if (senha !== undefined) fireEvent.changeText(tela.getByPlaceholderText('Senha'), senha);
  };

  beforeEach(() => {
    jest.resetAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe('renderização', () => {
    it('mostra o título, os campos, o botão e o link de cadastro', () => {
      const { getByText, getByPlaceholderText } = renderTela();

      expect(getByText('Acesse sua conta')).toBeTruthy();
      expect(getByPlaceholderText('E-mail')).toBeTruthy();
      expect(getByPlaceholderText('Senha')).toBeTruthy();
      expect(getByText('Entrar')).toBeTruthy();
      expect(getByText('Não tem conta? Cadastre-se.')).toBeTruthy();
    });

    it('configura os campos de e-mail e senha corretamente', () => {
      const { getByPlaceholderText } = renderTela();

      const email = getByPlaceholderText('E-mail');
      expect(email.props.keyboardType).toBe('email-address');
      expect(email.props.autoCapitalize).toBe('none');
      expect(getByPlaceholderText('Senha').props.secureTextEntry).toBe(true);
    });
  });

  describe('validação', () => {
    it('avisa quando nenhum campo foi preenchido', () => {
      const { getByText } = renderTela();

      fireEvent.press(getByText('Entrar'));

      expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Preencha todos os campos.');
      expect(loginUsuario).not.toHaveBeenCalled();
    });

    it.each([
      ['e-mail', { senha: CREDENCIAIS.senha }],
      ['senha', { email: CREDENCIAIS.email }],
    ])('avisa quando só o campo %s não foi preenchido', (_campo, parcial) => {
      const tela = renderTela();
      preencher(tela, parcial);

      fireEvent.press(tela.getByText('Entrar'));

      expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Preencha todos os campos.');
      expect(loginUsuario).not.toHaveBeenCalled();
      expect(navigation.goBack).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('envia e-mail e senha para a API', async () => {
      loginUsuario.mockResolvedValue(RESPOSTA);
      const tela = renderTela();
      preencher(tela, CREDENCIAIS);

      fireEvent.press(tela.getByText('Entrar'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
      expect(loginUsuario).toHaveBeenCalledWith(CREDENCIAIS.email, CREDENCIAIS.senha);
    });

    it('salva o token e o usuário no AsyncStorage', async () => {
      loginUsuario.mockResolvedValue(RESPOSTA);
      const tela = renderTela();
      preencher(tela, CREDENCIAIS);

      fireEvent.press(tela.getByText('Entrar'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@rotasdf_token', 'token-abc');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@rotasdf_usuario',
        JSON.stringify(RESPOSTA.usuario)
      );
    });

    it('dá boas-vindas pelo nome e volta para a tela anterior', async () => {
      loginUsuario.mockResolvedValue(RESPOSTA);
      const tela = renderTela();
      preencher(tela, CREDENCIAIS);

      fireEvent.press(tela.getByText('Entrar'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
      expect(alertSpy).toHaveBeenCalledWith('Bem-vindo!', 'Olá, Maria Silva');
    });

    it('troca o texto do botão por um indicador enquanto entra', () => {
      loginUsuario.mockReturnValue(new Promise(() => {}));
      const tela = renderTela();
      preencher(tela, CREDENCIAIS);

      fireEvent.press(tela.getByText('Entrar'));

      expect(tela.queryByText('Entrar')).toBeNull();
      expect(tela.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe('falhas', () => {
    it('mostra a mensagem de detalhes enviada pela API', async () => {
      loginUsuario.mockRejectedValue({
        response: { data: { detalhes: 'Conta bloqueada.' } },
      });
      const tela = renderTela();
      preencher(tela, CREDENCIAIS);

      fireEvent.press(tela.getByText('Entrar'));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Erro', 'Conta bloqueada.'));
      expect(navigation.goBack).not.toHaveBeenCalled();
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('mostra a mensagem padrão quando o erro não traz detalhes', async () => {
      loginUsuario.mockRejectedValue(new Error('Network Error'));
      const tela = renderTela();
      preencher(tela, CREDENCIAIS);

      fireEvent.press(tela.getByText('Entrar'));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Erro', MSG_PADRAO));
      expect(navigation.goBack).not.toHaveBeenCalled();
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('mostra a mensagem padrão e não volta quando falha ao salvar a sessão', async () => {
      loginUsuario.mockResolvedValue(RESPOSTA);
      AsyncStorage.setItem.mockRejectedValue(new Error('falha no storage'));
      const tela = renderTela();
      preencher(tela, CREDENCIAIS);

      fireEvent.press(tela.getByText('Entrar'));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Erro', MSG_PADRAO));
      expect(navigation.goBack).not.toHaveBeenCalled();
    });

    it('volta a mostrar o botão "Entrar" depois de uma falha', async () => {
      loginUsuario.mockRejectedValue(new Error('Network Error'));
      const tela = renderTela();
      preencher(tela, CREDENCIAIS);

      fireEvent.press(tela.getByText('Entrar'));

      expect(await tela.findByText('Entrar')).toBeTruthy();
      expect(tela.UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });
  });

  describe('navegação', () => {
    it('"Não tem conta? Cadastre-se." leva para a tela de Cadastro', () => {
      const { getByText } = renderTela();

      fireEvent.press(getByText('Não tem conta? Cadastre-se.'));

      expect(navigation.navigate).toHaveBeenCalledWith('Cadastro');
    });
  });
});