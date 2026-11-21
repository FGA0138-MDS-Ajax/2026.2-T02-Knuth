import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AnalisarReportesScreen from '../screens/AnalisarReportesScreen';
import { listarReportesAdmin } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
  },
}));

jest.mock('../services/api', () => ({
  listarReportesAdmin: jest.fn(),
}));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (effect) => {
      React.useEffect(effect, [effect]);
    },
  };
});

const REPORTES = [
  {
    id: 1,
    tipo: 'HORARIO',
    descricao: 'O ônibus das 07:30 não passou na parada.',
    linhaId: '0.110',
    paradaId: null,
    usuarioNome: 'Maria Silva',
    status: 'PENDENTE',
    observacaoAdmin: null,
  },
  {
    id: 2,
    tipo: 'PARADA',
    descricao: 'Parada desativada por obra na via.',
    linhaId: null,
    paradaId: 'P-204',
    usuarioNome: null,
    status: 'PROCEDENTE',
    observacaoAdmin: 'Parada marcada como suspensa no cadastro.',
  },
];

// -----testes------
describe('AnalisarReportesScreen', () => {
  const navigation = { navigate: jest.fn() };

  const renderTela = () => render(<AnalisarReportesScreen navigation={navigation} />);

  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue('token-admin');
  });

  it('exibe indicador de carregamento enquanto busca reportes', () => {
    listarReportesAdmin.mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getByType } = renderTela();

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('carrega e exibe os reportes com tipo, status, referência, autor e observação', async () => {
    listarReportesAdmin.mockResolvedValue(REPORTES);
    const { findByText, getByText } = renderTela();

    expect(await findByText('O ônibus das 07:30 não passou na parada.')).toBeTruthy();
    expect(listarReportesAdmin).toHaveBeenCalledWith('token-admin', {});
    expect(getByText('Horário')).toBeTruthy();
    expect(getByText('Pendente')).toBeTruthy();
    expect(getByText('Linha: 0.110')).toBeTruthy();
    expect(getByText('Enviado por: Maria Silva')).toBeTruthy();

    expect(getByText('Parada')).toBeTruthy();
    expect(getByText('Procedente')).toBeTruthy();
    expect(getByText('Parada: P-204')).toBeTruthy();
    expect(getByText('Enviado por: Passageiro anônimo')).toBeTruthy();
    expect(getByText('Correção / Obs.: Parada marcada como suspensa no cadastro.')).toBeTruthy();
  });

  it('exibe mensagem de lista vazia quando não há reportes', async () => {
    listarReportesAdmin.mockResolvedValue([]);
    const { findByText } = renderTela();

    expect(await findByText('Nenhum reporte encontrado para este filtro.')).toBeTruthy();
  });

  it('recarrega a lista filtrada ao selecionar um filtro de status', async () => {
    listarReportesAdmin.mockResolvedValue([]);
    const { findByText, getByText } = renderTela();
    await findByText('Nenhum reporte encontrado para este filtro.');

    fireEvent.press(getByText('Pendentes'));
    await waitFor(() =>
      expect(listarReportesAdmin).toHaveBeenCalledWith('token-admin', { status: 'PENDENTE' })
    );

    fireEvent.press(getByText('Procedentes'));
    await waitFor(() =>
      expect(listarReportesAdmin).toHaveBeenCalledWith('token-admin', { status: 'PROCEDENTE' })
    );

    fireEvent.press(getByText('Improcedentes'));
    await waitFor(() =>
      expect(listarReportesAdmin).toHaveBeenCalledWith('token-admin', { status: 'IMPROCEDENTE' })
    );
  });

  it('navega para DetalheReporte ao tocar em um item da lista', async () => {
    listarReportesAdmin.mockResolvedValue(REPORTES);
    const { findByText } = renderTela();

    fireEvent.press(await findByText('O ônibus das 07:30 não passou na parada.'));

    expect(navigation.navigate).toHaveBeenCalledWith('DetalheReporte', { reporte: REPORTES[0] });
  });

  it('mostra aviso de erro quando falha ao carregar os reportes', async () => {
    listarReportesAdmin.mockRejectedValue({
      response: { data: { detalhes: 'Acesso restrito ao administrador.' } },
    });
    renderTela();

    await waitFor(() =>
      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Acesso restrito ao administrador.')
    );
  });

  it('mostra erro genérico quando a falha não traz detalhes', async () => {
    listarReportesAdmin.mockRejectedValue(new Error('Network Error'));
    renderTela();

    await waitFor(() =>
      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível carregar os reportes.')
    );
  });
});
