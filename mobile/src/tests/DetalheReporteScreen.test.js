import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DetalheReporteScreen from '../screens/DetalheReporteScreen';
import { analisarReporteAdmin } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
  },
}));

jest.mock('../services/api', () => ({
  analisarReporteAdmin: jest.fn(),
}));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
}));

const REPORTE = {
  id: 12,
  tipo: 'ITINERARIO',
  descricao: 'A linha 0.110 não passa mais pela quadra 305.',
  linhaId: '0.110',
  paradaId: 'P-10',
  usuarioNome: 'João',
  usuarioEmail: 'joao@email.com',
  status: 'PENDENTE',
  observacaoAdmin: '',
};

// -----testes------
describe('DetalheReporteScreen', () => {
  const navigation = { goBack: jest.fn() };

  const renderTela = (reporte = REPORTE) =>
    render(<DetalheReporteScreen route={{ params: { reporte } }} navigation={navigation} />);

  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue('token-admin');
  });

  it('exibe os dados do reporte, as opções de classificação e o botão de salvar', () => {
    const { getByText } = renderTela();

    expect(getByText('Tipo: Itinerário')).toBeTruthy();
    expect(getByText(REPORTE.descricao)).toBeTruthy();
    expect(getByText('Linha relacionada: 0.110')).toBeTruthy();
    expect(getByText('Parada relacionada: P-10')).toBeTruthy();
    expect(getByText('Passageiro: João (joao@email.com)')).toBeTruthy();
    expect(getByText('Pendente')).toBeTruthy();
    expect(getByText('Procedente')).toBeTruthy();
    expect(getByText('Improcedente')).toBeTruthy();
    expect(getByText('Salvar análise')).toBeTruthy();
  });

  it('exige descrição da correção quando classificado como Procedente', () => {
    const { getByText } = renderTela();

    fireEvent.press(getByText('Procedente'));
    fireEvent.press(getByText('Salvar análise'));

    expect(mostrarAviso).toHaveBeenCalledWith(
      'Atenção',
      'Informe a correção realizada ao classificar o reporte como procedente.'
    );
    expect(analisarReporteAdmin).not.toHaveBeenCalled();
  });

  it('salva classificação Procedente com correção registrada e volta para a lista', async () => {
    analisarReporteAdmin.mockResolvedValue({ ...REPORTE, status: 'PROCEDENTE' });
    const { getByText, getByPlaceholderText } = renderTela();

    fireEvent.press(getByText('Procedente'));
    fireEvent.changeText(
      getByPlaceholderText('Descreva a correção aplicada nos dados...'),
      '  Itinerário atualizado removendo a quadra 305.  '
    );
    fireEvent.press(getByText('Salvar análise'));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
    expect(analisarReporteAdmin).toHaveBeenCalledWith('token-admin', 12, {
      status: 'PROCEDENTE',
      observacaoAdmin: 'Itinerário atualizado removendo a quadra 305.',
    });
    expect(mostrarAviso).toHaveBeenCalledWith(
      'Análise salva',
      'Classificação do reporte atualizada com sucesso.'
    );
  });

  it('permite classificar como Improcedente sem observação obrigatória', async () => {
    analisarReporteAdmin.mockResolvedValue({ ...REPORTE, status: 'IMPROCEDENTE' });
    const { getByText } = renderTela();

    fireEvent.press(getByText('Improcedente'));
    fireEvent.press(getByText('Salvar análise'));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
    expect(analisarReporteAdmin).toHaveBeenCalledWith('token-admin', 12, {
      status: 'IMPROCEDENTE',
      observacaoAdmin: '',
    });
  });

  it('exibe indicador de carregamento enquanto salva', async () => {
    analisarReporteAdmin.mockReturnValue(new Promise(() => {}));
    const { getByText, queryByText, UNSAFE_getByType } = renderTela();

    fireEvent.press(getByText('Improcedente'));
    fireEvent.press(getByText('Salvar análise'));

    await waitFor(() => expect(queryByText('Salvar análise')).toBeNull());
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('mostra o erro retornado pela API e não volta', async () => {
    analisarReporteAdmin.mockRejectedValue({
      response: { data: { detalhes: 'Reporte não encontrado.' } },
    });
    const { getByText } = renderTela();

    fireEvent.press(getByText('Improcedente'));
    fireEvent.press(getByText('Salvar análise'));

    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Reporte não encontrado.'));
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('mostra mensagem genérica quando falha sem detalhes', async () => {
    analisarReporteAdmin.mockRejectedValue(new Error('Network Error'));
    const { getByText } = renderTela();

    fireEvent.press(getByText('Improcedente'));
    fireEvent.press(getByText('Salvar análise'));

    await waitFor(() =>
      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível salvar a análise.')
    );
  });
});
