import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NovaLinhaScreen from '../screens/NovaLinhaScreen';
import { criarLinha, editarLinha } from '../services/api';
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
  criarLinha: jest.fn(),
  editarLinha: jest.fn(),
}));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
  confirmarAcao: jest.fn(),
}));

const TOKEN = 'token-admin';
const LINHA = {
  id: '0.110',
  codigo: '0.110',
  nome: 'Rodoviária/Asa Sul',
  cor: '#006666',
  tarifa: '5.50',
  faixa_tarifaria: 'METROPOLITANA 1',
  operadora: 'Urbi · Bacia 03',
  extensao_km: '12.50',
};

// -----testes------
describe('NovaLinhaScreen', () => {
  const navigation = { goBack: jest.fn(), setOptions: jest.fn() };

  const renderTela = (params) =>
    render(<NovaLinhaScreen navigation={navigation} route={params ? { params } : {}} />);

  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue(TOKEN);
  });

  describe('inclusão', () => {
    it('usa o título "Nova linha" e deixa o código editável', () => {
      const { getByText, getByPlaceholderText } = renderTela();

      expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Nova linha' });
      expect(getByText('Criar linha')).toBeTruthy();
      expect(getByPlaceholderText('Ex.: 0.110').props.value).toBe('');
      expect(getByPlaceholderText('Ex.: 0.110').props.editable).toBe(true);
    });

    it('envia o código e os demais campos e volta para a lista', async () => {
      criarLinha.mockResolvedValue({ id: '0.111' });
      const { getByText, getByPlaceholderText } = renderTela();

      fireEvent.changeText(getByPlaceholderText('Ex.: 0.110'), '0.111');
      fireEvent.changeText(getByPlaceholderText('Ex.: Rodoviária do Plano Piloto/W3 Sul'), 'Linha nova');
      fireEvent.changeText(getByPlaceholderText('Ex.: 5,50'), '6,00');
      fireEvent.press(getByText('Criar linha'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@rotasdf_token');
      expect(criarLinha).toHaveBeenCalledWith(TOKEN, {
        codigo: '0.111',
        nome: 'Linha nova',
        cor: '',
        tarifa: '6,00',
        faixa_tarifaria: '',
        operadora: '',
        extensao_km: '',
      });
      expect(editarLinha).not.toHaveBeenCalled();
      expect(mostrarAviso).toHaveBeenCalledWith('Pronto', 'Linha criada.');
    });

    it('mostra o erro da API e continua na tela', async () => {
      criarLinha.mockRejectedValue({ response: { data: { detalhes: 'Já existe uma linha com o código 0.110.' } } });
      const { getByText } = renderTela();

      fireEvent.press(getByText('Criar linha'));

      await waitFor(() =>
        expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Já existe uma linha com o código 0.110.')
      );
      expect(navigation.goBack).not.toHaveBeenCalled();
      expect(getByText('Criar linha')).toBeTruthy();
    });

    it('usa uma mensagem padrão quando a API não explica o erro', async () => {
      criarLinha.mockRejectedValue(new Error('Network Error'));
      const { getByText } = renderTela();

      fireEvent.press(getByText('Criar linha'));

      await waitFor(() =>
        expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível salvar a linha.')
      );
    });
  });

  describe('edição', () => {
    it('usa o título "Editar linha" e preenche os campos com a linha', () => {
      const { getByText, getByDisplayValue } = renderTela({ linha: LINHA });

      expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Editar linha' });
      expect(getByDisplayValue('Rodoviária/Asa Sul')).toBeTruthy();
      expect(getByDisplayValue('#006666')).toBeTruthy();
      expect(getByDisplayValue('5.50')).toBeTruthy();
      expect(getByDisplayValue('METROPOLITANA 1')).toBeTruthy();
      expect(getByDisplayValue('Urbi · Bacia 03')).toBeTruthy();
      expect(getByDisplayValue('12.50')).toBeTruthy();
      expect(getByText('Salvar alterações')).toBeTruthy();
    });

    it('não deixa alterar o código', () => {
      const { getByText, getByDisplayValue } = renderTela({ linha: LINHA });

      expect(getByDisplayValue('0.110').props.editable).toBe(false);
      expect(getByText('O código identifica a linha e não pode ser alterado.')).toBeTruthy();
    });

    it('envia as alterações sem o código e volta para a lista', async () => {
      editarLinha.mockResolvedValue({ id: '0.110' });
      const { getByText, getByDisplayValue } = renderTela({ linha: LINHA });

      fireEvent.changeText(getByDisplayValue('Rodoviária/Asa Sul'), 'Rodoviária/Asa Sul (W3)');
      fireEvent.press(getByText('Salvar alterações'));

      await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
      expect(editarLinha).toHaveBeenCalledWith(TOKEN, '0.110', {
        nome: 'Rodoviária/Asa Sul (W3)',
        cor: '#006666',
        tarifa: '5.50',
        faixa_tarifaria: 'METROPOLITANA 1',
        operadora: 'Urbi · Bacia 03',
        extensao_km: '12.50',
      });
      expect(criarLinha).not.toHaveBeenCalled();
      expect(mostrarAviso).toHaveBeenCalledWith('Pronto', 'Linha atualizada.');
    });

    it('mostra vazios os campos opcionais sem valor', () => {
      const { getByPlaceholderText } = renderTela({
        linha: { id: '2302', codigo: '2302', nome: 'Santa Maria', cor: null, tarifa: null, extensao_km: null },
      });

      expect(getByPlaceholderText('Ex.: #006666').props.value).toBe('');
      expect(getByPlaceholderText('Ex.: 5,50').props.value).toBe('');
      expect(getByPlaceholderText('Ex.: 28,5').props.value).toBe('');
    });
  });
});
