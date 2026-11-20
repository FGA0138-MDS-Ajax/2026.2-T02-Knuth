import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LinhasScreen from '../screens/LinhasScreen';
import { getLinhas } from '../services/api';

jest.setTimeout(15000);

jest.mock('../services/api', () => ({
  getLinhas: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
});

const LINHAS = [
  { id: 1, codigo: '0.111', nome: 'Rodoviária / Asa Sul' },
  { id: 2, codigo: '0.222', nome: 'W3 Norte / Lago Norte' },
  { id: 3, codigo: '2.333', nome: 'Aeroporto / Taguatinga' },
];

const PLACEHOLDER_BUSCA = 'Pesquisar por número ou nome...';

// -----testes------
describe('LinhasScreen', () => {
  const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
  let erroSpy;

  const renderTela = () => render(<LinhasScreen navigation={navigation} />);

  const renderCarregada = async () => {
    getLinhas.mockResolvedValue(LINHAS);
    const tela = renderTela();
    await waitFor(() => expect(getLinhas).toHaveBeenCalled());
    await tela.findByText(LINHAS[0].nome);
    return tela;
  };

  const abrirCabecalho = () => {
    const { headerRight } = navigation.setOptions.mock.calls[0][0];
    return render(headerRight());
  };

  beforeEach(() => {
    jest.resetAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('carregamento', () => {
    it('mostra o indicador e a mensagem enquanto busca as linhas', () => {
      getLinhas.mockReturnValue(new Promise(() => {}));
      const { getByText, queryByText, UNSAFE_getByType } = renderTela();

      expect(getByText('Carregando linhas...')).toBeTruthy();
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
      expect(queryByText('Planejar Viagem')).toBeNull();
    });

    it('busca as linhas uma única vez ao abrir', async () => {
      await renderCarregada();

      expect(getLinhas).toHaveBeenCalledTimes(1);
    });

    it('esconde o indicador depois de receber as linhas', async () => {
      const { queryByText, UNSAFE_queryByType } = await renderCarregada();

      expect(queryByText('Carregando linhas...')).toBeNull();
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });
  });

  describe('cabeçalho', () => {
    it('configura os botões do cabeçalho ao abrir a tela', () => {
      getLinhas.mockReturnValue(new Promise(() => {}));
      renderTela();

      expect(navigation.setOptions).toHaveBeenCalledWith({ headerRight: expect.any(Function) });
    });

    it('o ícone de alertas do cabeçalho leva para Alertas', () => {
      getLinhas.mockReturnValue(new Promise(() => {}));
      renderTela();
      const cabecalho = abrirCabecalho();

      fireEvent.press(cabecalho.getByText('warning-outline'));

      expect(navigation.navigate).toHaveBeenCalledWith('Alertas');
    });

    it('o ícone de configurações do cabeçalho leva para Configuracoes', () => {
      getLinhas.mockReturnValue(new Promise(() => {}));
      renderTela();
      const cabecalho = abrirCabecalho();

      fireEvent.press(cabecalho.getByText('settings-outline'));

      expect(navigation.navigate).toHaveBeenCalledWith('Configuracoes');
    });
  });

  describe('lista de linhas', () => {
    it('mostra código e nome de cada linha', async () => {
      const { getByText, getAllByText } = await renderCarregada();

      LINHAS.forEach((linha) => {
        expect(getByText(linha.codigo)).toBeTruthy();
        expect(getByText(linha.nome)).toBeTruthy();
      });
      expect(getAllByText('Toque para ver horários')).toHaveLength(LINHAS.length);
    });

    it('ao tocar em uma linha, abre os horários dela', async () => {
      const { getByText } = await renderCarregada();

      fireEvent.press(getByText('W3 Norte / Lago Norte'));

      expect(navigation.navigate).toHaveBeenCalledWith('Horarios', { linhaId: 2 });
    });
  });

  describe('botões de ação', () => {
    it('"Planejar Viagem" leva para BuscarTrajeto', async () => {
      const { getByText } = await renderCarregada();

      fireEvent.press(getByText('Planejar Viagem'));

      expect(navigation.navigate).toHaveBeenCalledWith('BuscarTrajeto');
    });

    it('"Alertas" leva para a tela de Alertas', async () => {
      const { getByText } = await renderCarregada();

      fireEvent.press(getByText('Alertas'));

      expect(navigation.navigate).toHaveBeenCalledWith('Alertas');
    });
  });

  describe('pesquisa', () => {
    it('filtra pelo número da linha', async () => {
      const { getByPlaceholderText, getByText, queryByText } = await renderCarregada();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_BUSCA), '333');

      expect(getByText('Aeroporto / Taguatinga')).toBeTruthy();
      expect(queryByText('Rodoviária / Asa Sul')).toBeNull();
      expect(queryByText('W3 Norte / Lago Norte')).toBeNull();
    });

    it('filtra pelo nome da linha', async () => {
      const { getByPlaceholderText, getByText, queryByText } = await renderCarregada();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_BUSCA), 'lago');

      expect(getByText('W3 Norte / Lago Norte')).toBeTruthy();
      expect(queryByText('Rodoviária / Asa Sul')).toBeNull();
      expect(queryByText('Aeroporto / Taguatinga')).toBeNull();
    });

    it('ignora diferença entre maiúsculas e minúsculas', async () => {
      const { getByPlaceholderText, getByText, queryByText } = await renderCarregada();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_BUSCA), 'AEROPORTO');

      expect(getByText('Aeroporto / Taguatinga')).toBeTruthy();
      expect(queryByText('Rodoviária / Asa Sul')).toBeNull();
    });

    it('mostra a mensagem de vazio com o termo digitado quando nada corresponde', async () => {
      const { getByPlaceholderText, getByText, queryByText } = await renderCarregada();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_BUSCA), 'xyz');

      expect(getByText('Nenhuma linha encontrada para "xyz"')).toBeTruthy();
      expect(queryByText('Rodoviária / Asa Sul')).toBeNull();
    });

    it('só mostra o botão de limpar quando há texto digitado', async () => {
      const { getByPlaceholderText, queryByText } = await renderCarregada();

      expect(queryByText('close-circle')).toBeNull();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_BUSCA), 'lago');

      expect(queryByText('close-circle')).toBeTruthy();
    });

    it('o botão de limpar apaga a busca e mostra todas as linhas de novo', async () => {
      const { getByPlaceholderText, getByText, queryByText } = await renderCarregada();
      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_BUSCA), 'lago');

      fireEvent.press(getByText('close-circle'));

      expect(getByPlaceholderText(PLACEHOLDER_BUSCA).props.value).toBe('');
      expect(getByText('Rodoviária / Asa Sul')).toBeTruthy();
      expect(getByText('Aeroporto / Taguatinga')).toBeTruthy();
      expect(queryByText('close-circle')).toBeNull();
    });
  });

  describe('sem linhas', () => {
    it('mostra a mensagem de vazio quando a API não devolve linhas', async () => {
      getLinhas.mockResolvedValue([]);
      const { findByText } = renderTela();

      expect(await findByText('Nenhuma linha encontrada para ""')).toBeTruthy();
    });

    it('registra o erro e mostra a lista vazia quando a API falha', async () => {
      getLinhas.mockRejectedValue(new Error('Network Error'));
      const { findByText, queryByText } = renderTela();

      expect(await findByText('Nenhuma linha encontrada para ""')).toBeTruthy();
      expect(queryByText('Carregando linhas...')).toBeNull();
      await waitFor(() => expect(erroSpy).toHaveBeenCalledWith(expect.any(Error)));
    });
  });
});