import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ExcluirContaScreen from '../screens/ExcluirContaScreen';
import { excluirMinhaConta } from '../services/api';
import { mostrarAviso, confirmarAcao } from '../utils/dialogos';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../services/api', () => ({
  excluirMinhaConta: jest.fn(),
}));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
  confirmarAcao: jest.fn(),
}));

const TOKEN = 'token-passageiro';

// -----testes------
describe('ExcluirContaScreen', () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };

  const renderTela = () => render(<ExcluirContaScreen navigation={navigation} />);

  const pedirExclusao = (tela, senha = 'senha123') => {
    fireEvent.changeText(tela.getByPlaceholderText('Senha atual'), senha);
    fireEvent.press(tela.getByText('Excluir conta definitivamente'));
  };

  const confirmar = async () => {
    const aoConfirmar = confirmarAcao.mock.calls[0][3];
    await act(async () => {
      await aoConfirmar();
    });
  };

  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue(TOKEN);
  });

  describe('renderização', () => {
    it('mostra o título, o aviso de ação permanente, a senha e os botões', () => {
      const { getByText, getByPlaceholderText } = renderTela();

      expect(getByText('Excluir minha conta')).toBeTruthy();
      expect(getByText(/Esta ação é permanente/)).toBeTruthy();
      expect(getByPlaceholderText('Senha atual').props.secureTextEntry).toBe(true);
      expect(getByText('Excluir conta definitivamente')).toBeTruthy();
      expect(getByText('Cancelar')).toBeTruthy();
    });

    it('"Cancelar" volta para a tela anterior', () => {
      const { getByText } = renderTela();

      fireEvent.press(getByText('Cancelar'));

      expect(navigation.goBack).toHaveBeenCalled();
    });
  });

  describe('confirmação', () => {
    it('avisa quando a senha não foi informada e não pede confirmação', () => {
      const { getByText } = renderTela();

      fireEvent.press(getByText('Excluir conta definitivamente'));

      expect(mostrarAviso).toHaveBeenCalledWith('Atenção', 'Informe sua senha para confirmar.');
      expect(confirmarAcao).not.toHaveBeenCalled();
    });

    it('pede confirmação antes de excluir', () => {
      const tela = renderTela();

      pedirExclusao(tela);

      expect(confirmarAcao).toHaveBeenCalledWith(
        'Excluir conta',
        'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
        'Excluir',
        expect.any(Function)
      );
      expect(excluirMinhaConta).not.toHaveBeenCalled();
    });
  });

  describe('exclusão', () => {
    it('exclui com o token salvo e a senha, limpa a sessão e volta para Linhas', async () => {
      excluirMinhaConta.mockResolvedValue({ mensagem: 'Conta excluída com sucesso.' });
      const tela = renderTela();
      pedirExclusao(tela, 'minhaSenha');

      await confirmar();

      expect(excluirMinhaConta).toHaveBeenCalledWith(TOKEN, 'minhaSenha');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@rotasdf_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@rotasdf_usuario');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@rotasdf_buscas_recentes');
      expect(mostrarAviso).toHaveBeenCalledWith('Conta excluída', 'Sua conta foi excluída com sucesso.');
      expect(navigation.navigate).toHaveBeenCalledWith('Linhas');
    });

    it('sem sessão salva, avisa e leva para o Login sem chamar a API', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const tela = renderTela();
      pedirExclusao(tela);

      await confirmar();

      expect(excluirMinhaConta).not.toHaveBeenCalled();
      expect(mostrarAviso).toHaveBeenCalledWith(
        'Sessão expirada',
        'Entre novamente na sua conta para excluí-la.'
      );
      expect(navigation.navigate).toHaveBeenCalledWith('Login');
    });

    it('mostra o erro da API (senha incorreta) e mantém a sessão', async () => {
      excluirMinhaConta.mockRejectedValue({ response: { data: { detalhes: 'Senha incorreta.' } } });
      const tela = renderTela();
      pedirExclusao(tela, 'errada');

      await confirmar();

      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Senha incorreta.');
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
      expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('mostra mensagem genérica quando a falha não traz detalhes', async () => {
      excluirMinhaConta.mockRejectedValue(new Error('Network Error'));
      const tela = renderTela();
      pedirExclusao(tela);

      await confirmar();

      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível excluir a conta. Tente novamente.');
    });

    it('troca o texto do botão por um indicador enquanto exclui', async () => {
      excluirMinhaConta.mockReturnValue(new Promise(() => {}));
      const tela = renderTela();
      pedirExclusao(tela);

      act(() => {
        confirmarAcao.mock.calls[0][3]();
      });

      await waitFor(() => expect(tela.queryByText('Excluir conta definitivamente')).toBeNull());
      expect(tela.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });
});
