import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EditarUsuarioScreen from '../screens/EditarUsuarioScreen';
import { atualizarUsuario, excluirUsuario } from '../services/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../services/api', () => ({
  atualizarUsuario: jest.fn(),
  excluirUsuario: jest.fn(),
}));

const USUARIO = { id: 7, nome: 'Maria Silva', email: 'maria@email.com', tipo: 'PASSAGEIRO' };
const PLACEHOLDER_SENHA = 'Deixe em branco para não alterar';
const MSG_GENERICA = 'Não foi possível completar a ação.';

// -----testes------
describe('EditarUsuarioScreen', () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  let alertSpy;

  const renderTela = (params = {}) =>
    render(
      <EditarUsuarioScreen
        route={{ params: { usuario: USUARIO, ehVoce: false, ...params } }}
        navigation={navigation}
      />
    );

  const abrirDialogoDeExclusao = (tela) => {
    fireEvent.press(tela.getByText('Excluir usuário'));
    return alertSpy.mock.calls[0][2];
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
    it('mostra os rótulos e os valores atuais do usuário', () => {
      const { getByText, getByDisplayValue, getByPlaceholderText } = renderTela();

      expect(getByText('Nome')).toBeTruthy();
      expect(getByText('E-mail')).toBeTruthy();
      expect(getByText('Nova senha (opcional)')).toBeTruthy();
      expect(getByText('Tipo')).toBeTruthy();
      expect(getByDisplayValue(USUARIO.nome)).toBeTruthy();
      expect(getByDisplayValue(USUARIO.email)).toBeTruthy();
      expect(getByPlaceholderText(PLACEHOLDER_SENHA)).toBeTruthy();
    });

    it('configura os campos de e-mail e senha corretamente', () => {
      const { getByDisplayValue, getByPlaceholderText } = renderTela();

      const email = getByDisplayValue(USUARIO.email);
      expect(email.props.keyboardType).toBe('email-address');
      expect(email.props.autoCapitalize).toBe('none');
      expect(getByPlaceholderText(PLACEHOLDER_SENHA).props.secureTextEntry).toBe(true);
    });

    it('mostra as opções de tipo e os botões de salvar e excluir', () => {
      const { getByText } = renderTela();

      expect(getByText('Passageiro')).toBeTruthy();
      expect(getByText('Administrador')).toBeTruthy();
      expect(getByText('Salvar alterações')).toBeTruthy();
      expect(getByText('Excluir usuário')).toBeTruthy();
    });

    it('na própria conta, mostra o aviso e esconde o botão de excluir', () => {
      const { getByText, queryByText } = renderTela({ ehVoce: true });

      expect(
        getByText('Esta é a sua conta: você não pode alterar seu tipo nem excluí-la.')
      ).toBeTruthy();
      expect(queryByText('Excluir usuário')).toBeNull();
    });

    it('em outro usuário, não mostra o aviso de conta própria', () => {
      const { queryByText } = renderTela();

      expect(
        queryByText('Esta é a sua conta: você não pode alterar seu tipo nem excluí-la.')
      ).toBeNull();
    });
  });

  describe('salvar alterações', () => {
    it('envia os dados atuais sem senha quando nada foi alterado', async () => {
      atualizarUsuario.mockResolvedValue({});
      const { getByText } = renderTela();

      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@rotasdf_token');
      expect(atualizarUsuario).toHaveBeenCalledWith('token-admin', USUARIO.id, {
        nome: USUARIO.nome,
        email: USUARIO.email,
        tipo: USUARIO.tipo,
      });
      expect(atualizarUsuario.mock.calls[0][2]).not.toHaveProperty('senha');
      expect(alertSpy).toHaveBeenCalledWith('Pronto', 'Usuário atualizado.');
    });

    it('envia nome e e-mail editados', async () => {
      atualizarUsuario.mockResolvedValue({});
      const { getByText, getByDisplayValue } = renderTela();

      fireEvent.changeText(getByDisplayValue(USUARIO.nome), 'Maria Souza');
      fireEvent.changeText(getByDisplayValue(USUARIO.email), 'maria.souza@email.com');
      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
      expect(atualizarUsuario).toHaveBeenCalledWith('token-admin', USUARIO.id, {
        nome: 'Maria Souza',
        email: 'maria.souza@email.com',
        tipo: USUARIO.tipo,
      });
    });

    it('inclui a nova senha somente quando ela foi preenchida', async () => {
      atualizarUsuario.mockResolvedValue({});
      const { getByText, getByPlaceholderText } = renderTela();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_SENHA), 'novaSenha123');
      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
      expect(atualizarUsuario).toHaveBeenCalledWith('token-admin', USUARIO.id, {
        nome: USUARIO.nome,
        email: USUARIO.email,
        tipo: USUARIO.tipo,
        senha: 'novaSenha123',
      });
    });

    it('envia o tipo escolhido ao tocar em "Administrador"', async () => {
      atualizarUsuario.mockResolvedValue({});
      const { getByText } = renderTela();

      fireEvent.press(getByText('Administrador'));
      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
      expect(atualizarUsuario.mock.calls[0][2].tipo).toBe('ADMIN');
    });

    it('permite voltar o tipo para "Passageiro" antes de salvar', async () => {
      atualizarUsuario.mockResolvedValue({});
      const { getByText } = renderTela({ usuario: { ...USUARIO, tipo: 'ADMIN' } });

      fireEvent.press(getByText('Passageiro'));
      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
      expect(atualizarUsuario.mock.calls[0][2].tipo).toBe('PASSAGEIRO');
    });

    it('troca o texto do botão por "Salvando..." enquanto salva', () => {
      atualizarUsuario.mockReturnValue(new Promise(() => {}));
      const { getByText, queryByText } = renderTela();

      fireEvent.press(getByText('Salvar alterações'));

      expect(getByText('Salvando...')).toBeTruthy();
      expect(queryByText('Salvar alterações')).toBeNull();
    });

    it('mostra a mensagem de detalhes enviada pela API quando falha', async () => {
      atualizarUsuario.mockRejectedValue({
        response: { data: { detalhes: 'E-mail já cadastrado.' } },
      });
      const { getByText } = renderTela();

      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Erro', 'E-mail já cadastrado.'));
      expect(navigation.goBack).not.toHaveBeenCalled();
    });

    it('mostra uma mensagem genérica quando o erro não traz detalhes', async () => {
      atualizarUsuario.mockRejectedValue(new Error('Network Error'));
      const { getByText } = renderTela();

      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Erro', MSG_GENERICA));
      expect(navigation.goBack).not.toHaveBeenCalled();
    });

    it('mostra a mensagem genérica quando falha ao ler o token salvo', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('falha no storage'));
      const { getByText } = renderTela();

      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Erro', MSG_GENERICA));
      expect(atualizarUsuario).not.toHaveBeenCalled();
    });

    it('volta a mostrar "Salvar alterações" depois de uma falha', async () => {
      atualizarUsuario.mockRejectedValue(new Error('Network Error'));
      const { getByText, findByText, queryByText } = renderTela();

      fireEvent.press(getByText('Salvar alterações'));

      expect(await findByText('Salvar alterações')).toBeTruthy();
      expect(queryByText('Salvando...')).toBeNull();
    });
  });

  describe('própria conta', () => {
    it('não deixa alterar o tipo do próprio usuário', async () => {
      atualizarUsuario.mockResolvedValue({});
      const { getByText } = renderTela({ usuario: { ...USUARIO, tipo: 'ADMIN' }, ehVoce: true });

      fireEvent.press(getByText('Passageiro'));
      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
      expect(atualizarUsuario.mock.calls[0][2].tipo).toBe('ADMIN');
    });
  });

  describe('excluir usuário', () => {
    it('pede confirmação com o nome do usuário e os botões "Cancelar" e "Excluir"', () => {
      const tela = renderTela();

      fireEvent.press(tela.getByText('Excluir usuário'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Excluir usuário',
        'Tem certeza que deseja excluir Maria Silva?',
        [
          expect.objectContaining({ text: 'Cancelar', style: 'cancel' }),
          expect.objectContaining({
            text: 'Excluir',
            style: 'destructive',
            onPress: expect.any(Function),
          }),
        ]
      );
    });

    it('não exclui enquanto o usuário não confirma', () => {
      const tela = renderTela();

      const botoes = abrirDialogoDeExclusao(tela);

      expect(botoes.find((b) => b.text === 'Cancelar').onPress).toBeUndefined();
      expect(excluirUsuario).not.toHaveBeenCalled();
      expect(navigation.goBack).not.toHaveBeenCalled();
    });

    it('ao confirmar, exclui com o token salvo e volta', async () => {
      excluirUsuario.mockResolvedValue({});
      const tela = renderTela();
      const botoes = abrirDialogoDeExclusao(tela);

      await act(async () => {
        await botoes.find((b) => b.text === 'Excluir').onPress();
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@rotasdf_token');
      expect(excluirUsuario).toHaveBeenCalledWith('token-admin', USUARIO.id);
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('mostra a mensagem de detalhes da API quando a exclusão falha', async () => {
      excluirUsuario.mockRejectedValue({
        response: { data: { detalhes: 'Usuário possui vínculos e não pode ser excluído.' } },
      });
      const tela = renderTela();
      const botoes = abrirDialogoDeExclusao(tela);

      await act(async () => {
        await botoes.find((b) => b.text === 'Excluir').onPress();
      });

      expect(alertSpy).toHaveBeenLastCalledWith(
        'Erro',
        'Usuário possui vínculos e não pode ser excluído.'
      );
      expect(navigation.goBack).not.toHaveBeenCalled();
    });

    it('mostra uma mensagem genérica quando a exclusão falha sem detalhes', async () => {
      excluirUsuario.mockRejectedValue(new Error('Network Error'));
      const tela = renderTela();
      const botoes = abrirDialogoDeExclusao(tela);

      await act(async () => {
        await botoes.find((b) => b.text === 'Excluir').onPress();
      });

      expect(alertSpy).toHaveBeenLastCalledWith('Erro', MSG_GENERICA);
      expect(navigation.goBack).not.toHaveBeenCalled();
    });
  });
});