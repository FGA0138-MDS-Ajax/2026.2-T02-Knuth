import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import FavoritosSecao from '../components/FavoritosSecao';

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
const PARADA = { id: 2, tipo: 'PARADA', paradaId: 'P1', paradaNome: 'Rodoviária' };
const TRAJETO = { id: 3, tipo: 'TRAJETO', origem: 'Asa Sul', destino: 'Rodoviária' };

describe('FavoritosSecao', () => {
  let estado;
  let store;
  let avisarMudanca;
  let cancelarStore;
  let navigation;

  beforeEach(() => {
    jest.resetAllMocks();
    estado = { logado: true, favoritos: [] };
    cancelarStore = jest.fn();
    store = {
      obter: jest.fn(() => estado),
      carregar: jest.fn().mockResolvedValue(),
      buscar: jest.fn(() => ({ id: 1 })),
      alternar: jest.fn().mockResolvedValue(),
      inscrever: jest.fn((aviso) => {
        avisarMudanca = aviso;
        return cancelarStore;
      }),
    };
    navigation = { navigate: jest.fn() };
  });

  const renderSecao = () => render(<FavoritosSecao navigation={navigation} store={store} />);

  it('não mostra nada quando não há passageiro logado', () => {
    estado = { logado: false, favoritos: [] };

    const { queryByText } = renderSecao();

    expect(queryByText('Favoritos')).toBeNull();
  });

  it('mostra uma dica quando o passageiro ainda não tem favoritos', () => {
    const { getByText } = renderSecao();

    expect(getByText('Favoritos')).toBeTruthy();
    expect(getByText('Toque na estrela de uma linha para salvá-la aqui.')).toBeTruthy();
  });

  it('lista as linhas favoritas e ignora os outros tipos', () => {
    estado = { logado: true, favoritos: [LINHA, PARADA, TRAJETO] };

    const { getByText, queryByText } = renderSecao();

    expect(getByText('0.782')).toBeTruthy();
    expect(getByText('Circular Itapoã / Paranoá')).toBeTruthy();
    expect(queryByText('Rodoviária')).toBeNull();
    expect(queryByText('Toque na estrela de uma linha para salvá-la aqui.')).toBeNull();
  });

  it('abre os horários da linha ao tocar no cartão', () => {
    estado = { logado: true, favoritos: [LINHA] };

    const { getByText } = renderSecao();
    fireEvent.press(getByText('Circular Itapoã / Paranoá'));

    expect(navigation.navigate).toHaveBeenCalledWith('Horarios', { linhaId: '0.782' });
  });

  it('não carrega os favoritos por conta própria', () => {
    renderSecao();

    expect(store.carregar).not.toHaveBeenCalled();
  });

  it('atualiza a lista quando o store avisa que mudou', () => {
    const { queryByText, getByText } = renderSecao();
    expect(queryByText('0.782')).toBeNull();

    estado = { logado: true, favoritos: [LINHA] };
    act(() => {
      avisarMudanca();
    });

    expect(getByText('0.782')).toBeTruthy();
  });

  it('cancela a inscrição no store ao sair da tela', () => {
    const { unmount } = renderSecao();

    unmount();

    expect(cancelarStore).toHaveBeenCalled();
  });
});