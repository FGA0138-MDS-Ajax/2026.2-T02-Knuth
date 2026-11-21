import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RodapeNavegacao from '../components/RodapeNavegacao';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
});

describe('RodapeNavegacao', () => {
  let navigation;

  beforeEach(() => {
    jest.resetAllMocks();
    navigation = { navigate: jest.fn() };
  });

  const renderRodape = (ativa) => render(<RodapeNavegacao navigation={navigation} ativa={ativa} />);

  it('mostra as abas Linhas e Favoritos', () => {
    const { getByText } = renderRodape('Linhas');

    expect(getByText('Linhas')).toBeTruthy();
    expect(getByText('Favoritos')).toBeTruthy();
  });

  it('marca a aba Linhas como selecionada', () => {
    const { getByLabelText } = renderRodape('Linhas');

    expect(getByLabelText('Aba Linhas').props.accessibilityState).toMatchObject({ selected: true });
    expect(getByLabelText('Aba Favoritos').props.accessibilityState).toMatchObject({ selected: false });
  });

  it('marca a aba Favoritos como selecionada e mostra a estrela cheia', () => {
    const { getByLabelText, getByText } = renderRodape('Favoritos');

    expect(getByLabelText('Aba Favoritos').props.accessibilityState).toMatchObject({ selected: true });
    expect(getByText('star')).toBeTruthy();
  });

  it('abre os favoritos ao tocar na aba Favoritos', () => {
    const { getByLabelText } = renderRodape('Linhas');

    fireEvent.press(getByLabelText('Aba Favoritos'));

    expect(navigation.navigate).toHaveBeenCalledWith('Favoritos');
  });

  it('volta para as linhas ao tocar na aba Linhas', () => {
    const { getByLabelText } = renderRodape('Favoritos');

    fireEvent.press(getByLabelText('Aba Linhas'));

    expect(navigation.navigate).toHaveBeenCalledWith('Linhas');
  });

  it('não navega ao tocar na aba que já está aberta', () => {
    const { getByLabelText } = renderRodape('Linhas');

    fireEvent.press(getByLabelText('Aba Linhas'));

    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
