import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import FavoritoEstrela from '../components/FavoritoEstrela';
import { mostrarAviso } from '../utils/dialogos';

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

const ITEM = { tipo: 'LINHA', linhaId: '0.782' };

describe('FavoritoEstrela', () => {
  let store;
  let avisarMudanca;
  let cancelar;

  beforeEach(() => {
    jest.resetAllMocks();
    cancelar = jest.fn();
    store = {
      buscar: jest.fn().mockReturnValue(undefined),
      alternar: jest.fn().mockResolvedValue(),
      inscrever: jest.fn((aviso) => {
        avisarMudanca = aviso;
        return cancelar;
      }),
    };
  });

  const renderEstrela = () => render(<FavoritoEstrela item={ITEM} store={store} />);

  it('mostra a estrela vazia quando o item não é favorito', () => {
    const { getByLabelText, getByText } = renderEstrela();

    expect(getByLabelText('Adicionar aos favoritos')).toBeTruthy();
    expect(getByText('star-outline')).toBeTruthy();
    expect(store.buscar).toHaveBeenCalledWith(ITEM);
  });

  it('mostra a estrela cheia quando o item é favorito', () => {
    store.buscar.mockReturnValue({ id: 1, ...ITEM });

    const { getByLabelText, getByText } = renderEstrela();

    expect(getByLabelText('Remover dos favoritos')).toBeTruthy();
    expect(getByText('star')).toBeTruthy();
  });

  it('liga ou desliga o favorito ao tocar', async () => {
    const { getByLabelText } = renderEstrela();

    fireEvent.press(getByLabelText('Adicionar aos favoritos'));

    await waitFor(() => expect(store.alternar).toHaveBeenCalledWith(ITEM));
    expect(mostrarAviso).not.toHaveBeenCalled();
  });

  it('mostra um aviso quando não foi possível alterar o favorito', async () => {
    store.alternar.mockRejectedValue(new Error('Entre na sua conta para usar favoritos.'));
    const { getByLabelText } = renderEstrela();

    fireEvent.press(getByLabelText('Adicionar aos favoritos'));

    await waitFor(() =>
      expect(mostrarAviso).toHaveBeenCalledWith('Favoritos', 'Entre na sua conta para usar favoritos.')
    );
  });

  it('mostra uma mensagem padrão quando o erro não traz texto', async () => {
    store.alternar.mockRejectedValue({});
    const { getByLabelText } = renderEstrela();

    fireEvent.press(getByLabelText('Adicionar aos favoritos'));

    await waitFor(() =>
      expect(mostrarAviso).toHaveBeenCalledWith('Favoritos', 'Não foi possível atualizar os favoritos.')
    );
  });

  it('atualiza a estrela quando o store avisa que a lista mudou', () => {
    const { getByLabelText, queryByLabelText } = renderEstrela();
    expect(queryByLabelText('Remover dos favoritos')).toBeNull();

    store.buscar.mockReturnValue({ id: 1, ...ITEM });
    act(() => {
      avisarMudanca();
    });

    expect(getByLabelText('Remover dos favoritos')).toBeTruthy();
  });

  it('cancela a inscrição no store ao sair da tela', () => {
    const { unmount } = renderEstrela();

    unmount();

    expect(cancelar).toHaveBeenCalled();
  });
});