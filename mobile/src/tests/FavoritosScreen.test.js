import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import FavoritosScreen from '../screens/FavoritosScreen';

jest.mock('../utils/favoritosStore', () => ({ favoritosStore: {} }));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
});

const LINHA = {
  id: 1,
  tipo: 'LINHA',
  linhaId: '0.782',
  linhaCodigo: '0.782',
  linhaNome: 'Circular Itapoã / Paranoá',
};

const DICA = 'Toque na estrela de uma linha, parada ou trajeto para salvá-lo aqui.';
const AVISO_SEM_LOGIN = 'Entre na sua conta para ver seus favoritos.';

describe('FavoritosScreen', () => {
  let estado;
  let avisos;
  let store;
  let navigation;

  beforeEach(() => {
    jest.resetAllMocks();
    estado = { logado: true, favoritos: [] };
    avisos = [];
    store = {
      obter: jest.fn(() => estado),
      carregar: jest.fn().mockResolvedValue(),
      buscar: jest.fn(() => ({ id: 1 })),
      alternar: jest.fn().mockResolvedValue(),
      inscrever: jest.fn((aviso) => {
        avisos.push(aviso);
        return () => {};
      }),
    };
    navigation = { navigate: jest.fn(), addListener: jest.fn(() => () => {}) };
  });

  const renderTela = () => render(<FavoritosScreen navigation={navigation} store={store} />);

  it('carrega os favoritos ao abrir', () => {
    renderTela();

    expect(store.carregar).toHaveBeenCalledTimes(1);
  });

  it('mostra a dica quando o passageiro ainda não tem favoritos', () => {
    const { getByText, queryByText } = renderTela();

    expect(getByText(DICA)).toBeTruthy();
    expect(queryByText(AVISO_SEM_LOGIN)).toBeNull();
  });

  it('lista as linhas favoritas do passageiro', () => {
    estado = { logado: true, favoritos: [LINHA] };

    const { getByText } = renderTela();

    expect(getByText('0.782')).toBeTruthy();
    expect(getByText('Circular Itapoã / Paranoá')).toBeTruthy();
  });

  it('pede o login quando não há passageiro logado', () => {
    estado = { logado: false, favoritos: [] };

    const { getByText, queryByText } = renderTela();

    expect(getByText(AVISO_SEM_LOGIN)).toBeTruthy();
    expect(queryByText(DICA)).toBeNull();
  });

  it('abre a tela de login ao tocar em Fazer login', () => {
    estado = { logado: false, favoritos: [] };

    const { getByText } = renderTela();
    fireEvent.press(getByText('Fazer login'));

    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('mostra a lista quando o login é detectado depois', () => {
    estado = { logado: false, favoritos: [] };
    const { getByText, queryByText } = renderTela();
    expect(queryByText(DICA)).toBeNull();

    estado = { logado: true, favoritos: [] };
    act(() => {
      avisos.forEach((aviso) => aviso());
    });

    expect(getByText(DICA)).toBeTruthy();
    expect(queryByText(AVISO_SEM_LOGIN)).toBeNull();
  });

  it('mostra o rodapé com a aba Favoritos selecionada e volta às linhas', () => {
    const { getByLabelText } = renderTela();

    expect(getByLabelText('Aba Favoritos').props.accessibilityState).toMatchObject({ selected: true });

    fireEvent.press(getByLabelText('Aba Linhas'));

    expect(navigation.navigate).toHaveBeenCalledWith('Linhas');
  });
});