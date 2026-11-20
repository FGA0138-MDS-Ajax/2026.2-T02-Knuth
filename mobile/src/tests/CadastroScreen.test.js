import React from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import CadastroScreen from '../screens/CadastroScreen';
import { cadastrarUsuario } from '../services/api';

jest.mock('../src/services/api', () => ({
  cadastrarUsuario: jest.fn(),
}));

const DADOS = { nome: 'Maria Silva', email: 'maria@email.com', senha: 'senha123' };

// ---------- Testes ----------

describe('CadastroScreen', () => {
  const navigation = { navigate: jest.fn() };
  let alertSpy;

  const renderTela = () => render(<CadastroScreen navigation={navigation} />);

  const preencher = (tela, { nome, email, senha }) => {
    if (nome !== undefined) fireEvent.changeText(tela.getByPlaceholderText('Nome completo'), nome);
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
    it('mostra o título, os campos, o botão e o link para o login', () => {
      const { getByText, getByPlaceholderText } = renderTela();

      expect(getByText('Criar Conta')).toBeTruthy();
      expect(getByPlaceholderText('Nome completo')).toBeTruthy();
      expect(getByPlaceholderText('E-mail')).toBeTruthy();
      expect(getByPlaceholderText('Senha')).toBeTruthy();
      expect(getByText('Cadastrar')).toBeTruthy();
      expect(getByText('Já tenho conta. Fazer login.')).toBeTruthy();
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

      fireEvent.press(getByText('Cadastrar'));

      expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Preencha todos os campos.');
      expect(cadastrarUsuario).not.toHaveBeenCalled();
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
      expect(cadastrarUsuario).not.toHaveBeenCalled();
      expect(navigation.navigate).not.toHaveBeenCalled();
    });
  });

  describe('cadastro', () => {
    it('envia nome, e-mail e senha, avisa o sucesso e vai para o Login', async () => {
      cadastrarUsuario.mockResolvedValue({});
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('Login'));
      expect(cadastrarUsuario).toHaveBeenCalledWith(DADOS.nome, DADOS.email, DADOS.senha);
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Conta criada! Faça login para continuar.');
    });

    it('troca o texto do botão por um indicador enquanto cadastra', () => {
      cadastrarUsuario.mockReturnValue(new Promise(() => {}));
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      expect(tela.queryByText('Cadastrar')).toBeNull();
      expect(tela.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('mostra a mensagem de detalhes enviada pela API quando o cadastro falha', async () => {
      cadastrarUsuario.mockRejectedValue({
        response: { data: { detalhes: 'E-mail já cadastrado.' } },
      });
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Erro', 'E-mail já cadastrado.'));
      expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('mostra uma mensagem genérica quando o erro não traz detalhes', async () => {
      cadastrarUsuario.mockRejectedValue(new Error('Network Error'));
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Erro', 'Erro ao cadastrar.'));
      expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('volta a mostrar o botão "Cadastrar" depois de uma falha', async () => {
      cadastrarUsuario.mockRejectedValue(new Error('Network Error'));
      const tela = renderTela();
      preencher(tela, DADOS);

      fireEvent.press(tela.getByText('Cadastrar'));

      expect(await tela.findByText('Cadastrar')).toBeTruthy();
      expect(tela.UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });
  });

  describe('navegação', () => {
    it('"Já tenho conta. Fazer login." leva para a tela de Login', () => {
      const { getByText } = renderTela();

      fireEvent.press(getByText('Já tenho conta. Fazer login.'));

      expect(navigation.navigate).toHaveBeenCalledWith('Login');
    });
  });
});