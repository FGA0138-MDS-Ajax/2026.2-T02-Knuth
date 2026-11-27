import React from 'react';
import { render } from '@testing-library/react-native';
import FavoritosScreen from '../screens/FavoritosScreen';

jest.mock('../utils/favoritosStore', () => ({ favoritosStore: {} }));

jest.mock('../components/AvisosSecao', () => {
  const { Text } = require('react-native');
  return () => require('react').createElement(Text, null, 'seção de avisos');
});

jest.mock('../components/FavoritosCarregador', () => () => null);
jest.mock('../components/FavoritosSecao', () => () => null);
jest.mock('../components/RodapeNavegacao', () => () => null);

const criarStore = (logado) => ({
  obter: jest.fn(() => ({ logado, favoritos: [] })),
  inscrever: jest.fn(() => () => {})
});

describe('FavoritosScreen com avisos', () => {
  const navigation = { navigate: jest.fn(), addListener: jest.fn(() => () => {}) };

  it('mostra a seção de avisos para quem está logado', () => {
    const { getByText } = render(
      <FavoritosScreen navigation={navigation} store={criarStore(true)} />
    );

    expect(getByText('seção de avisos')).toBeTruthy();
  });

  it('não mostra a seção de avisos para quem não está logado', () => {
    const { queryByText, getByText } = render(
      <FavoritosScreen navigation={navigation} store={criarStore(false)} />
    );

    expect(queryByText('seção de avisos')).toBeNull();
    expect(getByText('Entre na sua conta para ver seus favoritos.')).toBeTruthy();
  });
});
