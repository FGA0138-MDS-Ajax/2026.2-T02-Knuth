import React from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CriarAdminScreen from '../src/screens/CriarAdminScreen';
import { criarAdministrador } from '../src/services/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../src/services/api', () => ({
  criarAdministrador: jest.fn(),
}));

const DADOS = { nome: 'Carlos Souza', email: 'carlos@email.com', senha: 'senha123' };
const PLACEHOLDER_SENHA = 'Senha (mínimo 6 caracteres)';

// -----testes------
describe('CriarAdminScreen', () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  let alertSpy;

  const renderTela = () => render(<CriarAdminScreen navigation={navigation} />);

  const preencher = (tela, { nome, email, senha }) => {
    if (nome !== undefined) fireEvent.changeText(tela.getByPlaceholderText('Nome'), nome);
    if (email !== undefined) fireEvent.changeText(tela.getByPlaceholderText('E-mail'), email);
    if (senha !== undefined) fireEvent.changeText(tela.getByPlaceholderText(PLACEHOLDER_SENHA), senha);
  };

  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue('token-admin');
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe('renderização', () => {
    it('mostra o título, os campos e o botão', () => {
      const { getByText, getByPlaceholderText } = renderTela();

      expect(getByText('Novo administrador')).toBeTruthy();
      expect(getByPlaceholderText('Nome')).toBeTruthy();
      expect(getByPlaceholderText('E-mail')).toBeTruthy();
      expect(getByPlaceholderText(PLACEHOLDER_SENHA)).toBeTruthy();
      expect(getByText('Cadastrar')).toBeTruthy();
    });

    it('configura os campos de e-mail e senha corretamente', () => {
      const { getByPlaceholderText } = renderTela();

      const email = getByPlaceholderText('E-mail');
      expect(email.props.keyboardType).toBe('email-address');
      expect(email.props.autoCapitalize).toBe('none');
      expect(getByPlaceholderText(PLACEHOLDER_SENHA).props.secureTextEntry).toBe(true);
    });
  });

  describe('validação', () => {
    it('avisa quando nenhum campo foi preenchido', () => {
      const { getByText } = renderTela();

      fireEvent.press(getByText('Cadastrar'));

      expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Preencha todos os campos.');
      expect(criarAdministrador).not.toHaveBeenCalled();
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it.each([
      ['nome', { email: DADOS.email, senha: DADOS.senha }],
      ['e-mail', { nome: DADOS.nome, senha: DADOS.senha }],
      ['senha', { nome: DADOS.nome, email: DADOS.email }],
    ])('avisa quando só o campo %s não foi preenchido', (_campo, parcial) => {
      const tela = renderTela();
      preencher(tela, parcial);

      fireEvent.press(tela.getByText('Cadastrar'));

      expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Preencha todos os campos.');
      expect(criarAdministrador).not.toHaveBeenCalled();
      expect(navigation.goBack).not.toHaveBeenCalled();
    });
  });

  describe('cadastro', () => {
    it('envia o token salvo com nome, e-mail e senha, avisa o sucesso e volta', async () => {
      criarAdministrador.mockResolvedValue({ nome: 'Carlos Souza' });
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@rotasdf_token');
      expect(criarAdministrador).toHaveBeenCalledWith(
        'token-admin',
        DADOS.nome,
        DADOS.email,
        DADOS.senha
      );
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Administrador Carlos Souza cadastrado.');
    });

    it('usa o nome devolvido pela API na mensagem de sucesso', async () => {
      criarAdministrador.mockResolvedValue({ nome: 'Carlos S.' });
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Administrador Carlos S. cadastrado.')
      );
    });

    it('troca o texto do botão por um indicador enquanto cadastra', () => {
      criarAdministrador.mockReturnValue(new Promise(() => {}));
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      expect(tela.queryByText('Cadastrar')).toBeNull();
      expect(tela.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('mostra a mensagem de detalhes enviada pela API quando o cadastro falha', async () => {
      criarAdministrador.mockRejectedValue({
        response: { data: { detalhes: 'E-mail já cadastrado.' } },
      });
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Erro', 'E-mail já cadastrado.'));
      expect(navigation.goBack).not.toHaveBeenCalled();
    });

    it('mostra uma mensagem genérica quando o erro não traz detalhes', async () => {
      criarAdministrador.mockRejectedValue(new Error('Network Error'));
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith(
          'Erro',
          'Não foi possível cadastrar o administrador.'
        )
      );
      expect(navigation.goBack).not.toHaveBeenCalled();
    });

    it('mostra a mensagem genérica quando falha ao ler o token salvo', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('falha no storage'));
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith(
          'Erro',
          'Não foi possível cadastrar o administrador.'
        )
      );
      expect(criarAdministrador).not.toHaveBeenCalled();
      expect(navigation.goBack).not.toHaveBeenCalled();
    });

    it('volta a mostrar o botão "Cadastrar" depois de uma falha', async () => {
      criarAdministrador.mockRejectedValue(new Error('Network Error'));
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      expect(await tela.findByText('Cadastrar')).toBeTruthy();
      expect(tela.UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });
  });
});