import React from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GerenciarUsuariosScreen from '../src/screens/GerenciarUsuariosScreen';
import { listarUsuarios } from '../src/services/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../src/services/api', () => ({
  listarUsuarios: jest.fn(),
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
const MSG_ERRO = 'Não foi possível carregar os usuários.';

const MARIA = { id: 1, nome: 'Maria Silva', email: 'maria@email.com', tipo: 'ADMIN' };
const JOAO = { id: 2, nome: 'João Pereira', email: 'joao@email.com', tipo: 'PASSAGEIRO' };

function mockStorage(valores) {
  AsyncStorage.getItem.mockImplementation(async (chave) => valores[chave] ?? null);
}

// -----testes------
describe('GerenciarUsuariosScreen', () => {
  const navigation = { navigate: jest.fn() };
  let alertSpy;

  const renderTela = () => render(<GerenciarUsuariosScreen navigation={navigation} />);

  beforeEach(() => {
    jest.resetAllMocks();
    mockStorage({ [TOKEN_KEY]: 'token-admin', [USUARIO_KEY]: JSON.stringify({ id: MARIA.id }) });
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe('carregamento', () => {
    it('mostra o indicador enquanto busca os usuários', () => {
      listarUsuarios.mockReturnValue(new Promise(() => {}));
      const { UNSAFE_getByType, queryByText } = renderTela();

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
      expect(queryByText('Nenhum usuário encontrado.')).toBeNull();
    });

    it('busca os usuários com o token salvo e sem filtro ao abrir', async () => {
      listarUsuarios.mockResolvedValue([MARIA, JOAO]);
      const { findByText, UNSAFE_queryByType } = renderTela();

      await findByText(JOAO.nome);

      expect(listarUsuarios).toHaveBeenCalledWith('token-admin', undefined);
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });
  });

  describe('lista de usuários', () => {
    it('mostra nome, e-mail e tipo de cada usuário', async () => {
      listarUsuarios.mockResolvedValue([MARIA, JOAO]);
      const { findByText, getByText } = renderTela();

      await findByText(JOAO.nome);

      expect(getByText(JOAO.email)).toBeTruthy();
      expect(getByText(MARIA.email)).toBeTruthy();
      expect(getByText('Admin')).toBeTruthy();
      expect(getByText('Passageiro')).toBeTruthy();
    });

    it('marca com "(você)" o usuário logado', async () => {
      listarUsuarios.mockResolvedValue([MARIA, JOAO]);
      const { findByText, getByText, queryByText } = renderTela();

      expect(await findByText('Maria Silva (você)')).toBeTruthy();
      expect(getByText(JOAO.nome)).toBeTruthy();
      expect(queryByText('João Pereira (você)')).toBeNull();
    });

    it('não marca ninguém com "(você)" quando não há usuário salvo', async () => {
      mockStorage({ [TOKEN_KEY]: 'token-admin' });
      listarUsuarios.mockResolvedValue([MARIA, JOAO]);
      const { findByText, queryByText } = renderTela();

      await findByText(MARIA.nome);

      expect(queryByText('Maria Silva (você)')).toBeNull();
    });

    it('mostra a mensagem de lista vazia quando não há usuários', async () => {
      listarUsuarios.mockResolvedValue([]);
      const { findByText } = renderTela();

      expect(await findByText('Nenhum usuário encontrado.')).toBeTruthy();
    });
  });

  describe('navegação', () => {
    it('ao tocar em outro usuário, abre a edição com ehVoce falso', async () => {
      listarUsuarios.mockResolvedValue([MARIA, JOAO]);
      const { findByText } = renderTela();

      fireEvent.press(await findByText(JOAO.nome));

      expect(navigation.navigate).toHaveBeenCalledWith('EditarUsuario', {
        usuario: JOAO,
        ehVoce: false,
      });
    });

    it('ao tocar no próprio usuário, abre a edição com ehVoce verdadeiro', async () => {
      listarUsuarios.mockResolvedValue([MARIA, JOAO]);
      const { findByText } = renderTela();

      fireEvent.press(await findByText('Maria Silva (você)'));

      expect(navigation.navigate).toHaveBeenCalledWith('EditarUsuario', {
        usuario: MARIA,
        ehVoce: true,
      });
    });
  });

  describe('filtros', () => {
    it('mostra os três filtros', async () => {
      listarUsuarios.mockResolvedValue([MARIA, JOAO]);
      const { findByText, getByText } = renderTela();

      await findByText(JOAO.nome);

      expect(getByText('Todos')).toBeTruthy();
      expect(getByText('Administradores')).toBeTruthy();
      expect(getByText('Passageiros')).toBeTruthy();
    });

    it('"Administradores" busca somente o tipo ADMIN', async () => {
      listarUsuarios.mockResolvedValue([MARIA, JOAO]);
      const { findByText, getByText } = renderTela();
      await findByText(JOAO.nome);

      fireEvent.press(getByText('Administradores'));

      await waitFor(() =>
        expect(listarUsuarios).toHaveBeenLastCalledWith('token-admin', 'ADMIN')
      );
    });

    it('"Passageiros" busca somente o tipo PASSAGEIRO', async () => {
      listarUsuarios.mockResolvedValue([MARIA, JOAO]);
      const { findByText, getByText } = renderTela();
      await findByText(JOAO.nome);

      fireEvent.press(getByText('Passageiros'));

      await waitFor(() =>
        expect(listarUsuarios).toHaveBeenLastCalledWith('token-admin', 'PASSAGEIRO')
      );
    });

    it('"Todos" volta a buscar sem filtro', async () => {
      listarUsuarios.mockResolvedValue([MARIA, JOAO]);
      const { findByText, getByText } = renderTela();
      await findByText(JOAO.nome);

      fireEvent.press(getByText('Administradores'));
      await waitFor(() =>
        expect(listarUsuarios).toHaveBeenLastCalledWith('token-admin', 'ADMIN')
      );
      await findByText(JOAO.nome);

      fireEvent.press(getByText('Todos'));

      await waitFor(() =>
        expect(listarUsuarios).toHaveBeenLastCalledWith('token-admin', undefined)
      );
    });

    it('troca a lista pelo resultado do filtro escolhido', async () => {
      listarUsuarios.mockResolvedValueOnce([MARIA, JOAO]).mockResolvedValueOnce([MARIA]);
      const { findByText, getByText, queryByText } = renderTela();
      await findByText(JOAO.nome);

      fireEvent.press(getByText('Administradores'));

      await waitFor(() => expect(queryByText(JOAO.nome)).toBeNull());
      expect(getByText('Maria Silva (você)')).toBeTruthy();
    });
  });

  describe('erros', () => {
    it('avisa quando a API falha e mostra a lista vazia', async () => {
      listarUsuarios.mockRejectedValue(new Error('Network Error'));
      const { findByText } = renderTela();

      expect(await findByText('Nenhum usuário encontrado.')).toBeTruthy();
      expect(alertSpy).toHaveBeenCalledWith('Erro', MSG_ERRO);
    });

    it('avisa quando falha ao ler o token salvo', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('falha no storage'));
      const { findByText } = renderTela();

      await findByText('Nenhum usuário encontrado.');

      expect(alertSpy).toHaveBeenCalledWith('Erro', MSG_ERRO);
      expect(listarUsuarios).not.toHaveBeenCalled();
    });

    it('avisa quando o usuário salvo é um JSON inválido', async () => {
      mockStorage({ [TOKEN_KEY]: 'token-admin', [USUARIO_KEY]: '{json inválido' });
      const { findByText } = renderTela();

      await findByText('Nenhum usuário encontrado.');

      expect(alertSpy).toHaveBeenCalledWith('Erro', MSG_ERRO);
      expect(listarUsuarios).not.toHaveBeenCalled();
    });
  });
});