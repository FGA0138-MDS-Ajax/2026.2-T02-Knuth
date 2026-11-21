import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ReportarDivergenciaScreen from '../screens/ReportarDivergenciaScreen';
import { reportarDivergencia } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
  },
}));

jest.mock('../services/api', () => ({
  reportarDivergencia: jest.fn(),
}));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
}));

// -----testes------
describe('ReportarDivergenciaScreen', () => {
  const navigation = { goBack: jest.fn() };

  const renderTela = (params) =>
    render(<ReportarDivergenciaScreen route={{ params }} navigation={navigation} />);

  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  describe('renderização e pré-preenchimento', () => {
    it('exibe título, tipos de divergência, campos e botão de envio', () => {
      const { getByText, getByPlaceholderText } = renderTela();

      expect(getByText('Reportar divergência')).toBeTruthy();
      expect(getByText('Horário')).toBeTruthy();
      expect(getByText('Parada')).toBeTruthy();
      expect(getByText('Itinerário')).toBeTruthy();
      expect(getByPlaceholderText('Ex.: 0.110')).toBeTruthy();
      expect(getByPlaceholderText('Ex.: P-101 ou nome da parada')).toBeTruthy();
      expect(getByPlaceholderText(/Descreva o problema encontrado/)).toBeTruthy();
      expect(getByText('Enviar reporte')).toBeTruthy();
    });

    it('pré-preenche linha e parada recebidas por parâmetro', () => {
      const { getByPlaceholderText } = renderTela({
        tipo: 'PARADA',
        linhaId: '0.111',
        paradaId: 'P-101',
      });

      expect(getByPlaceholderText('Ex.: 0.110').props.value).toBe('0.111');
      expect(getByPlaceholderText('Ex.: P-101 ou nome da parada').props.value).toBe('P-101');
    });
  });

  describe('validações', () => {
    it('exige ao menos a linha ou a parada relacionada', () => {
      const { getByText, getByPlaceholderText } = renderTela();

      fireEvent.changeText(
        getByPlaceholderText(/Descreva o problema encontrado/),
        'O ônibus das 07:30 não passou hoje.'
      );
      fireEvent.press(getByText('Enviar reporte'));

      expect(mostrarAviso).toHaveBeenCalledWith(
        'Atenção',
        'Informe ao menos a linha ou a parada relacionada à divergência.'
      );
      expect(reportarDivergencia).not.toHaveBeenCalled();
    });

    it('exige descrição com pelo menos 10 caracteres', () => {
      const { getByText, getByPlaceholderText } = renderTela({ linhaId: '0.110' });

      fireEvent.changeText(getByPlaceholderText(/Descreva o problema encontrado/), 'Curto');
      fireEvent.press(getByText('Enviar reporte'));

      expect(mostrarAviso).toHaveBeenCalledWith(
        'Atenção',
        'A descrição da divergência deve ter pelo menos 10 caracteres.'
      );
      expect(reportarDivergencia).not.toHaveBeenCalled();
    });
  });

  describe('envio do reporte', () => {
    it('envia reporte de passageiro anônimo com tipo selecionado e volta para a tela anterior', async () => {
      reportarDivergencia.mockResolvedValue({ id: 1, status: 'PENDENTE' });
      const { getByText, getByPlaceholderText } = renderTela();

      fireEvent.press(getByText('Itinerário'));
      fireEvent.changeText(getByPlaceholderText('Ex.: 0.110'), ' 0.110 ');
      fireEvent.changeText(
        getByPlaceholderText(/Descreva o problema encontrado/),
        '  A linha não entra mais na quadra 305.  '
      );
      fireEvent.press(getByText('Enviar reporte'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
      expect(reportarDivergencia).toHaveBeenCalledWith({
        tipo: 'ITINERARIO',
        descricao: 'A linha não entra mais na quadra 305.',
        linhaId: '0.110',
        paradaId: null,
        usuarioId: null,
      });
      expect(mostrarAviso).toHaveBeenCalledWith(
        'Reporte enviado',
        'Obrigado! Sua informação será analisada pela nossa equipe.'
      );
    });

    it('anexa o usuarioId automaticamente quando há passageiro logado', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ id: 42, nome: 'Maria' }));
      reportarDivergencia.mockResolvedValue({ id: 2, status: 'PENDENTE' });
      const { getByText, getByPlaceholderText } = renderTela({
        tipo: 'PARADA',
        paradaId: 'P-204',
      });

      fireEvent.changeText(
        getByPlaceholderText(/Descreva o problema encontrado/),
        'Parada desativada por obra na avenida.'
      );
      fireEvent.press(getByText('Enviar reporte'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
      expect(reportarDivergencia).toHaveBeenCalledWith({
        tipo: 'PARADA',
        descricao: 'Parada desativada por obra na avenida.',
        linhaId: null,
        paradaId: 'P-204',
        usuarioId: 42,
      });
    });

    it('exibe indicador de carregamento enquanto envia', async () => {
      reportarDivergencia.mockReturnValue(new Promise(() => {}));
      const { getByText, getByPlaceholderText, queryByText, UNSAFE_getByType } = renderTela({
        linhaId: '0.110',
      });

      fireEvent.changeText(
        getByPlaceholderText(/Descreva o problema encontrado/),
        'Horário das 08:00 não confere com a saída.'
      );
      fireEvent.press(getByText('Enviar reporte'));

      await waitFor(() => expect(queryByText('Enviar reporte')).toBeNull());
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('exibe o erro retornado pela API (campo erro) e não volta', async () => {
      reportarDivergencia.mockRejectedValue({
        response: { data: { erro: 'Tipo de divergência inválido.' } },
      });
      const { getByText, getByPlaceholderText } = renderTela({ linhaId: '0.110' });

      fireEvent.changeText(
        getByPlaceholderText(/Descreva o problema encontrado/),
        'Horário das 08:00 não confere com a saída.'
      );
      fireEvent.press(getByText('Enviar reporte'));

      await waitFor(() =>
        expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Tipo de divergência inválido.')
      );
      expect(navigation.goBack).not.toHaveBeenCalled();
    });

    it('exibe mensagem genérica quando falha sem detalhes', async () => {
      reportarDivergencia.mockRejectedValue(new Error('Network Error'));
      const { getByText, getByPlaceholderText } = renderTela({ linhaId: '0.110' });

      fireEvent.changeText(
        getByPlaceholderText(/Descreva o problema encontrado/),
        'Horário das 08:00 não confere com a saída.'
      );
      fireEvent.press(getByText('Enviar reporte'));

      await waitFor(() =>
        expect(mostrarAviso).toHaveBeenCalledWith(
          'Erro',
          'Não foi possível enviar o reporte. Tente novamente.'
        )
      );
    });
  });
});
