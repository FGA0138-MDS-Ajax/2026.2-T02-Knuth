import React from 'react';
import { render, act } from '@testing-library/react-native';
import FavoritosCarregador from '../components/FavoritosCarregador';

jest.mock('../utils/favoritosStore', () => ({ favoritosStore: {} }));

describe('FavoritosCarregador', () => {
  let store;
  let navigation;
  let aoGanharFoco;
  let cancelarFoco;

  beforeEach(() => {
    jest.resetAllMocks();
    cancelarFoco = jest.fn();
    store = { carregar: jest.fn().mockResolvedValue() };
    navigation = {
      addListener: jest.fn((evento, funcao) => {
        aoGanharFoco = funcao;
        return cancelarFoco;
      }),
    };
  });

  it('carrega os favoritos ao abrir', () => {
    render(<FavoritosCarregador navigation={navigation} store={store} />);

    expect(store.carregar).toHaveBeenCalledTimes(1);
  });

  it('recarrega quando a tela volta ao foco', () => {
    render(<FavoritosCarregador navigation={navigation} store={store} />);

    act(() => {
      aoGanharFoco();
    });

    expect(navigation.addListener).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(store.carregar).toHaveBeenCalledTimes(2);
  });

  it('funciona quando a navegação não tem addListener', () => {
    render(<FavoritosCarregador navigation={{}} store={store} />);

    expect(store.carregar).toHaveBeenCalledTimes(1);
  });

  it('não desenha nada na tela', () => {
    const { toJSON } = render(<FavoritosCarregador navigation={navigation} store={store} />);

    expect(toJSON()).toBeNull();
  });

  it('cancela a inscrição de foco ao sair da tela', () => {
    const { unmount } = render(<FavoritosCarregador navigation={navigation} store={store} />);

    unmount();

    expect(cancelarFoco).toHaveBeenCalled();
  });
});
