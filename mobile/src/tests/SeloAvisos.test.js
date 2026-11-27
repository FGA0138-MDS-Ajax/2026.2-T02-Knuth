import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SeloAvisos from '../components/SeloAvisos';
import { getNotificacoesNaoLidas } from '../services/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn()
}));

jest.mock('../services/api', () => ({
  getNotificacoesNaoLidas: jest.fn()
}));

describe('SeloAvisos', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue('token-abc');
  });

  it('mostra a quantidade de avisos não lidos', async () => {
    getNotificacoesNaoLidas.mockResolvedValue({ naoLidas: 3 });

    const { findByText } = render(<SeloAvisos />);

    expect(await findByText('3', {}, { timeout: 5000 })).toBeTruthy();
    expect(getNotificacoesNaoLidas).toHaveBeenCalledWith('token-abc');
  });

  it('mostra 9+ quando passa de nove avisos', async () => {
    getNotificacoesNaoLidas.mockResolvedValue({ naoLidas: 12 });

    const { findByText } = render(<SeloAvisos />);

    expect(await findByText('9+')).toBeTruthy();
  });

  it('não mostra nada quando não há avisos não lidos', async () => {
    getNotificacoesNaoLidas.mockResolvedValue({ naoLidas: 0 });

    const { toJSON } = render(<SeloAvisos />);

    await waitFor(() => expect(getNotificacoesNaoLidas).toHaveBeenCalled());
    expect(toJSON()).toBeNull();
  });

  it('não mostra nada quando a busca falha', async () => {
    getNotificacoesNaoLidas.mockRejectedValue(new Error('falha'));

    const { toJSON } = render(<SeloAvisos />);

    await waitFor(() => expect(getNotificacoesNaoLidas).toHaveBeenCalled());
    expect(toJSON()).toBeNull();
  });

  it('não busca avisos sem token', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    render(<SeloAvisos />);

    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
    expect(getNotificacoesNaoLidas).not.toHaveBeenCalled();
  });

  it('atualiza a contagem quando a tela volta ao foco', async () => {
    const ouvintes = {};
    const navigation = {
      addListener: jest.fn((evento, funcao) => {
        ouvintes[evento] = funcao;
        return jest.fn();
      })
    };
    getNotificacoesNaoLidas
      .mockResolvedValueOnce({ naoLidas: 1 })
      .mockResolvedValueOnce({ naoLidas: 4 });

    const { findByText } = render(<SeloAvisos navigation={navigation} />);
    expect(await findByText('1')).toBeTruthy();

    await act(async () => {
      await ouvintes.focus();
    });

    expect(await findByText('4')).toBeTruthy();
  });
});
