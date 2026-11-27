import React from 'react';
import { render } from '@testing-library/react-native';
import RodapeNavegacao from '../components/RodapeNavegacao';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name)
  };
});

jest.mock('../components/SeloAvisos', () => {
  const { Text } = require('react-native');
  return () => require('react').createElement(Text, null, 'selo de avisos');
});

describe('RodapeNavegacao com selo de avisos', () => {
  const navigation = { navigate: jest.fn() };

  it('mostra o selo quando outra aba está ativa', () => {
    const { getAllByText } = render(
      <RodapeNavegacao navigation={navigation} ativa="Linhas" />
    );

    expect(getAllByText('selo de avisos')).toHaveLength(1);
  });

  it('esconde o selo quando a aba Favoritos está ativa', () => {
    const { queryByText } = render(
      <RodapeNavegacao navigation={navigation} ativa="Favoritos" />
    );

    expect(queryByText('selo de avisos')).toBeNull();
  });
});
