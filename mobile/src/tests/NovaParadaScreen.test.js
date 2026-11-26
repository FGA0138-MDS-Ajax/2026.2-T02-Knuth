import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NovaParadaScreen from '../screens/NovaParadaScreen';
import { criarParada, editarParada } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../services/api', () => ({
  criarParada: jest.fn(),
  editarParada: jest.fn(),
}));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
  confirmarAcao: jest.fn(),
}));

const TOKEN = 'token-admin';
const PARADA = {
  id: '3369',
  codigo: '3369',
  nome: 'Rodoviária do Plano Piloto',
  latitude: '-15.79420000',
  longitude: '-47.88220000',
  tipo: 'Placa',
  estrutura: 'ACOSTAMENTO OU BAIA',
};

// -----testes------
describe('NovaParadaScreen', () => {
  const navigation = { goBack: jest.fn(), setOptions: jest.fn() };

  const renderTela = (params) =>
    render(<NovaParadaScreen navigation={navigation} route={params ? { params } : {}} />);

  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue(TOKEN);
  });

  describe('inclusão', () => {
    it('usa o título "Nova parada" e deixa o código editável', () => {
      const { getByText, getByPlaceholderText } = renderTela();

      expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Nova parada' });
      expect(getByText('Criar parada')).toBeTruthy();
      expect(getByPlaceholderText('Ex.: 3369').props.value).toBe('');
      expect(getByPlaceholderText('Ex.: 3369').props.editable).toBe(true);
    });

    it('envia o código e os demais campos e volta para a lista', async () => {
      criarParada.mockResolvedValue({ id: '9999' });
      const { getByText, getByPlaceholderText } = renderTela();

      fireEvent.changeText(getByPlaceholderText('Ex.: 3369'), '9999');
      fireEvent.changeText(getByPlaceholderText('Ex.: Rodoviária do Plano Piloto'), 'Parada nova');
      fireEvent.changeText(getByPlaceholderText('Ex.: -15.7942'), '-15,80');
      fireEvent.changeText(getByPlaceholderText('Ex.: -47.8822'), '-47,90');
      fireEvent.press(getByText('Criar parada'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@rotasdf_token');
      expect(criarParada).toHaveBeenCalledWith(TOKEN, {
        codigo: '9999',
        nome: 'Parada nova',
        latitude: '-15,80',
        longitude: '-47,90',
        tipo: '',
        estrutura: '',
      });
      expect(editarParada).not.toHaveBeenCalled();
      expect(mostrarAviso).toHaveBeenCalledWith('Pronto', 'Parada criada.');
    });

    it('mostra o erro da API e continua na tela', async () => {
      criarParada.mockRejectedValue({ response: { data: { detalhes: 'A latitude é obrigatória.' } } });
      const { getByText } = renderTela();

      fireEvent.press(getByText('Criar parada'));

      await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'A latitude é obrigatória.'));
      expect(navigation.goBack).not.toHaveBeenCalled();
    });

    it('usa uma mensagem padrão quando a API não explica o erro', async () => {
      criarParada.mockRejectedValue(new Error('Network Error'));
      const { getByText } = renderTela();

      fireEvent.press(getByText('Criar parada'));

      await waitFor(() =>
        expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível salvar a parada.')
      );
    });
  });

  describe('edição', () => {
    it('usa o título "Editar parada" e preenche os campos com a parada', () => {
      const { getByText, getByDisplayValue } = renderTela({ parada: PARADA });

      expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Editar parada' });
      expect(getByDisplayValue('Rodoviária do Plano Piloto')).toBeTruthy();
      expect(getByDisplayValue('-15.79420000')).toBeTruthy();
      expect(getByDisplayValue('-47.88220000')).toBeTruthy();
      expect(getByDisplayValue('Placa')).toBeTruthy();
      expect(getByDisplayValue('ACOSTAMENTO OU BAIA')).toBeTruthy();
      expect(getByText('Salvar alterações')).toBeTruthy();
    });

    it('não deixa alterar o código', () => {
      const { getByText, getByDisplayValue } = renderTela({ parada: PARADA });

      expect(getByDisplayValue('3369').props.editable).toBe(false);
      expect(getByText('O código identifica a parada e não pode ser alterado.')).toBeTruthy();
    });

    it('mostra o id quando a parada não tem código', () => {
      const { getByDisplayValue } = renderTela({ parada: { ...PARADA, codigo: null } });

      expect(getByDisplayValue('3369')).toBeTruthy();
    });

    it('envia as alterações sem o código e volta para a lista', async () => {
      editarParada.mockResolvedValue({ id: '3369' });
      const { getByText, getByDisplayValue } = renderTela({ parada: PARADA });

      fireEvent.changeText(getByDisplayValue('Rodoviária do Plano Piloto'), 'Rodoviária');
      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
      expect(editarParada).toHaveBeenCalledWith(TOKEN, '3369', {
        nome: 'Rodoviária',
        latitude: '-15.79420000',
        longitude: '-47.88220000',
        tipo: 'Placa',
        estrutura: 'ACOSTAMENTO OU BAIA',
      });
      expect(criarParada).not.toHaveBeenCalled();
      expect(mostrarAviso).toHaveBeenCalledWith('Pronto', 'Parada atualizada.');
    });
  });
});
