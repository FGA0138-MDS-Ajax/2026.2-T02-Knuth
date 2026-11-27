import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AvisosSecao from '../components/AvisosSecao';
import { getNotificacoes, marcarNotificacaoLida } from '../services/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn()
}));

jest.mock('../services/api', () => ({
  getNotificacoes: jest.fn(),
  marcarNotificacaoLida: jest.fn()
}));

const NAO_LIDA = {
  id: 1,
  titulo: 'Linha 0.782 com desvio',
  resumo: 'Desvio pela W3 Sul',
  lida: false
};
const LIDA = {
  id: 2,
  titulo: 'Parada P1 fechada',
  resumo: 'Obra no local',
  lida: true
};

describe('AvisosSecao', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue('token-abc');
  });

  it('lista os avisos do passageiro', async () => {
    getNotificacoes.mockResolvedValue([NAO_LIDA, LIDA]);

    const { findByText } = render(<AvisosSecao />);

    expect(await findByText('Avisos', {}, { timeout: 5000 })).toBeTruthy();
    expect(await findByText('Linha 0.782 com desvio')).toBeTruthy();
    expect(await findByText('Desvio pela W3 Sul')).toBeTruthy();
    expect(await findByText('Parada P1 fechada')).toBeTruthy();
    expect(getNotificacoes).toHaveBeenCalledWith('token-abc');
  });

  it('mostra quantos avisos não foram lidos', async () => {
    getNotificacoes.mockResolvedValue([NAO_LIDA, LIDA]);

    const { findByText } = render(<AvisosSecao />);

    expect(await findByText('1 novo')).toBeTruthy();
  });

  it('marca como lido ao tocar em um aviso não lido', async () => {
    getNotificacoes.mockResolvedValue([NAO_LIDA, LIDA]);
    marcarNotificacaoLida.mockResolvedValue({ ...NAO_LIDA, lida: true });

    const { findByText, queryByText } = render(<AvisosSecao />);
    fireEvent.press(await findByText('Linha 0.782 com desvio'));

    await waitFor(() =>
      expect(marcarNotificacaoLida).toHaveBeenCalledWith('token-abc', 1)
    );
    await waitFor(() => expect(queryByText('1 novo')).toBeNull());
  });

  it('não marca de novo um aviso que já foi lido', async () => {
    getNotificacoes.mockResolvedValue([NAO_LIDA, LIDA]);

    const { findByText } = render(<AvisosSecao />);
    fireEvent.press(await findByText('Parada P1 fechada'));

    expect(marcarNotificacaoLida).not.toHaveBeenCalled();
  });

  it('não mostra nada quando não há avisos', async () => {
    getNotificacoes.mockResolvedValue([]);

    const { queryByText } = render(<AvisosSecao />);

    await waitFor(() => expect(getNotificacoes).toHaveBeenCalled());
    expect(queryByText('Avisos')).toBeNull();
  });

  it('não mostra nada quando a busca falha', async () => {
    getNotificacoes.mockRejectedValue(new Error('falha'));

    const { queryByText } = render(<AvisosSecao />);

    await waitFor(() => expect(getNotificacoes).toHaveBeenCalled());
    expect(queryByText('Avisos')).toBeNull();
  });

  it('não busca avisos sem token', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    render(<AvisosSecao />);

    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
    expect(getNotificacoes).not.toHaveBeenCalled();
  });
});
