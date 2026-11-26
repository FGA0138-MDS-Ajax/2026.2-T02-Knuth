import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ManterLinhasParadasScreen from '../screens/ManterLinhasParadasScreen';
import { getLinhas, excluirLinha, buscarParadasAdmin, obterParadaAdmin, excluirParada } from '../services/api';
import { mostrarAviso, confirmarAcao } from '../utils/dialogos';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../services/api', () => ({
  getLinhas: jest.fn(),
  excluirLinha: jest.fn(),
  buscarParadasAdmin: jest.fn(),
  obterParadaAdmin: jest.fn(),
  excluirParada: jest.fn(),
}));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
  confirmarAcao: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (effect) => {
      React.useEffect(effect, [effect]);
    },
  };
});

const TOKEN = 'token-admin';
const BUSCA_LINHA = 'Buscar linha por número ou nome';
const BUSCA_PARADA = 'Buscar parada por nome ou código (mín. 2 letras)';
const ASA_SUL = { id: '0.110', codigo: '0.110', nome: 'Rodoviária/Asa Sul', operadora: 'Urbi · Bacia 03' };
const SANTA_MARIA = { id: '2302', codigo: '2302', nome: 'Santa Maria/Rodoviária', operadora: null };
const RODOVIARIA = { id: '3369', codigo: '3369', nome: 'Rodoviária do Plano Piloto' };
const RODOVIARIA_COMPLETA = { ...RODOVIARIA, latitude: '-15.79420000', longitude: '-47.88220000', tipo: 'Placa', estrutura: null };

// -----testes------
describe('ManterLinhasParadasScreen', () => {
  const navigation = { navigate: jest.fn() };

  const renderTela = () => render(<ManterLinhasParadasScreen navigation={navigation} />);

  const confirmar = async () => {
    const aoConfirmar = confirmarAcao.mock.calls[0][3];
    await act(async () => {
      await aoConfirmar();
    });
  };

  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue(TOKEN);
  });

  describe('lista de linhas', () => {
    it('mostra o indicador enquanto carrega as linhas', () => {
      getLinhas.mockReturnValue(new Promise(() => {}));
      const { UNSAFE_getByType, queryByText } = renderTela();

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
      expect(queryByText('Nenhuma linha encontrada.')).toBeNull();
    });

    it('mostra código, nome e operadora de cada linha', async () => {
      getLinhas.mockResolvedValue([ASA_SUL, SANTA_MARIA]);
      const { findByText, getByText } = renderTela();

      expect(await findByText('0.110 - Rodoviária/Asa Sul')).toBeTruthy();
      expect(getByText('2302 - Santa Maria/Rodoviária')).toBeTruthy();
      expect(getByText('Urbi · Bacia 03')).toBeTruthy();
    });

    it('filtra pelo número ou pelo nome digitado', async () => {
      getLinhas.mockResolvedValue([ASA_SUL, SANTA_MARIA]);
      const { findByText, getByPlaceholderText, queryByText } = renderTela();
      await findByText('0.110 - Rodoviária/Asa Sul');

      fireEvent.changeText(getByPlaceholderText(BUSCA_LINHA), 'SANTA');
      expect(queryByText('0.110 - Rodoviária/Asa Sul')).toBeNull();
      expect(queryByText('2302 - Santa Maria/Rodoviária')).toBeTruthy();

      fireEvent.changeText(getByPlaceholderText(BUSCA_LINHA), '0.11');
      expect(queryByText('0.110 - Rodoviária/Asa Sul')).toBeTruthy();
      expect(queryByText('2302 - Santa Maria/Rodoviária')).toBeNull();
    });

    it('mostra a mensagem de lista vazia quando a busca não encontra nada', async () => {
      getLinhas.mockResolvedValue([ASA_SUL]);
      const { findByText, getByPlaceholderText } = renderTela();
      await findByText('0.110 - Rodoviária/Asa Sul');

      fireEvent.changeText(getByPlaceholderText(BUSCA_LINHA), 'xyz');

      expect(await findByText('Nenhuma linha encontrada.')).toBeTruthy();
    });

    it('avisa quando não consegue carregar as linhas', async () => {
      getLinhas.mockRejectedValue(new Error('Network Error'));
      const { findByText } = renderTela();

      expect(await findByText('Nenhuma linha encontrada.')).toBeTruthy();
      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível carregar as linhas.');
    });
  });

  describe('navegação', () => {
    it('"Nova linha" abre o formulário vazio', async () => {
      getLinhas.mockResolvedValue([]);
      const { getByText, findByText } = renderTela();
      await findByText('Nenhuma linha encontrada.');

      fireEvent.press(getByText('Nova linha'));

      expect(navigation.navigate).toHaveBeenCalledWith('NovaLinha');
    });

    it('"Editar" abre o formulário com a linha escolhida', async () => {
      getLinhas.mockResolvedValue([ASA_SUL]);
      const { findByText } = renderTela();

      fireEvent.press(await findByText('Editar'));

      expect(navigation.navigate).toHaveBeenCalledWith('NovaLinha', { linha: ASA_SUL });
    });

    it('"Horários" abre as partidas da linha escolhida', async () => {
      getLinhas.mockResolvedValue([ASA_SUL]);
      const { findByText } = renderTela();

      fireEvent.press(await findByText('Horários'));

      expect(navigation.navigate).toHaveBeenCalledWith('ManterHorarios', { linha: ASA_SUL });
    });
  });

  describe('exclusão', () => {
    it('pede confirmação avisando que viagens, horários e favoritos também serão apagados', async () => {
      getLinhas.mockResolvedValue([ASA_SUL]);
      const { findByText } = renderTela();

      fireEvent.press(await findByText('Excluir'));

      expect(confirmarAcao).toHaveBeenCalledWith(
        'Excluir linha',
        'A linha 0.110 será excluída junto com todas as viagens, horários e favoritos dela. Esta ação não pode ser desfeita.',
        'Excluir',
        expect.any(Function)
      );
      expect(excluirLinha).not.toHaveBeenCalled();
    });

    it('ao confirmar, exclui com o token salvo e recarrega a lista', async () => {
      getLinhas.mockResolvedValueOnce([ASA_SUL, SANTA_MARIA]).mockResolvedValueOnce([SANTA_MARIA]);
      excluirLinha.mockResolvedValue({ mensagem: 'Linha excluída.' });
      const { findByText, getAllByText, queryByText } = renderTela();
      await findByText('0.110 - Rodoviária/Asa Sul');

      fireEvent.press(getAllByText('Excluir')[0]);
      await confirmar();

      expect(excluirLinha).toHaveBeenCalledWith(TOKEN, '0.110');
      await waitFor(() => expect(queryByText('0.110 - Rodoviária/Asa Sul')).toBeNull());
      expect(getLinhas).toHaveBeenCalledTimes(2);
    });

    it('mostra o erro da API quando a exclusão falha', async () => {
      getLinhas.mockResolvedValue([ASA_SUL]);
      excluirLinha.mockRejectedValue({ response: { data: { detalhes: 'Linha não encontrada.' } } });
      const { findByText } = renderTela();

      fireEvent.press(await findByText('Excluir'));
      await confirmar();

      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Linha não encontrada.');
    });

    it('usa uma mensagem padrão quando a API não explica o erro', async () => {
      getLinhas.mockResolvedValue([ASA_SUL]);
      excluirLinha.mockRejectedValue(new Error('Network Error'));
      const { findByText } = renderTela();

      fireEvent.press(await findByText('Excluir'));
      await confirmar();

      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível excluir a linha.');
    });
  });

  describe('paradas', () => {
    // Abre a aba Paradas e busca o texto informado (a busca espera 400 ms depois da digitação)
    const buscarParadas = async (tela, texto = 'rodov') => {
      await tela.findByText('Nenhuma linha encontrada.');
      fireEvent.press(tela.getByText('Paradas'));
      fireEvent.changeText(tela.getByPlaceholderText(BUSCA_PARADA), texto);
    };

    beforeEach(() => {
      getLinhas.mockResolvedValue([]);
    });

    it('pede ao menos 2 letras e não busca antes disso', async () => {
      const tela = renderTela();
      await buscarParadas(tela, 'r');

      expect(tela.getByText('Digite ao menos 2 letras para buscar paradas.')).toBeTruthy();
      expect(tela.getByText('Nova parada')).toBeTruthy();
      expect(buscarParadasAdmin).not.toHaveBeenCalled();
    });

    it('busca as paradas com o token salvo e mostra nome e código', async () => {
      buscarParadasAdmin.mockResolvedValue([RODOVIARIA]);
      const tela = renderTela();
      await buscarParadas(tela);

      expect(await tela.findByText('Rodoviária do Plano Piloto')).toBeTruthy();
      expect(tela.getByText('Código 3369')).toBeTruthy();
      expect(buscarParadasAdmin).toHaveBeenCalledWith(TOKEN, 'rodov');
    });

    it('mostra a mensagem quando a busca não encontra paradas', async () => {
      buscarParadasAdmin.mockResolvedValue([]);
      const tela = renderTela();
      await buscarParadas(tela, 'xyz');

      await waitFor(() => expect(buscarParadasAdmin).toHaveBeenCalled());
      expect(tela.getByText('Nenhuma parada encontrada.')).toBeTruthy();
    });

    it('avisa quando a busca de paradas falha', async () => {
      buscarParadasAdmin.mockRejectedValue(new Error('Network Error'));
      const tela = renderTela();
      await buscarParadas(tela);

      await waitFor(() =>
        expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível buscar as paradas.')
      );
    });

    it('trocar de aba limpa a busca', async () => {
      const tela = renderTela();
      await tela.findByText('Nenhuma linha encontrada.');
      fireEvent.changeText(tela.getByPlaceholderText(BUSCA_LINHA), '0.11');

      fireEvent.press(tela.getByText('Paradas'));

      expect(tela.getByPlaceholderText(BUSCA_PARADA).props.value).toBe('');
    });

    it('"Nova parada" abre o formulário vazio', async () => {
      const tela = renderTela();
      await buscarParadas(tela, '');

      fireEvent.press(tela.getByText('Nova parada'));

      expect(navigation.navigate).toHaveBeenCalledWith('NovaParada');
    });

    it('"Editar" carrega a parada completa e abre o formulário', async () => {
      buscarParadasAdmin.mockResolvedValue([RODOVIARIA]);
      obterParadaAdmin.mockResolvedValue(RODOVIARIA_COMPLETA);
      const tela = renderTela();
      await buscarParadas(tela);

      fireEvent.press(await tela.findByText('Editar'));

      await waitFor(() =>
        expect(navigation.navigate).toHaveBeenCalledWith('NovaParada', { parada: RODOVIARIA_COMPLETA })
      );
      expect(obterParadaAdmin).toHaveBeenCalledWith(TOKEN, '3369');
    });

    it('"Editar" avisa quando não consegue carregar a parada', async () => {
      buscarParadasAdmin.mockResolvedValue([RODOVIARIA]);
      obterParadaAdmin.mockRejectedValue({ response: { data: { detalhes: 'Parada não encontrada.' } } });
      const tela = renderTela();
      await buscarParadas(tela);

      fireEvent.press(await tela.findByText('Editar'));

      await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Parada não encontrada.'));
      expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('pede confirmação antes de excluir a parada', async () => {
      buscarParadasAdmin.mockResolvedValue([RODOVIARIA]);
      const tela = renderTela();
      await buscarParadas(tela);

      fireEvent.press(await tela.findByText('Excluir'));

      expect(confirmarAcao).toHaveBeenCalledWith(
        'Excluir parada',
        'A parada Rodoviária do Plano Piloto será excluída e sairá dos favoritos dos passageiros. Esta ação não pode ser desfeita.',
        'Excluir',
        expect.any(Function)
      );
      expect(excluirParada).not.toHaveBeenCalled();
    });

    it('ao confirmar, exclui com o token salvo e tira a parada da lista', async () => {
      buscarParadasAdmin.mockResolvedValue([RODOVIARIA]);
      excluirParada.mockResolvedValue({ mensagem: 'Parada excluída.' });
      const tela = renderTela();
      await buscarParadas(tela);

      fireEvent.press(await tela.findByText('Excluir'));
      await confirmar();

      expect(excluirParada).toHaveBeenCalledWith(TOKEN, '3369');
      expect(tela.queryByText('Rodoviária do Plano Piloto')).toBeNull();
    });

    it('mostra o motivo quando a parada está no itinerário de alguma linha', async () => {
      const motivo = 'A parada não pode ser excluída porque faz parte do itinerário de 3 linhas.';
      buscarParadasAdmin.mockResolvedValue([RODOVIARIA]);
      excluirParada.mockRejectedValue({ response: { data: { detalhes: motivo } } });
      const tela = renderTela();
      await buscarParadas(tela);

      fireEvent.press(await tela.findByText('Excluir'));
      await confirmar();

      expect(mostrarAviso).toHaveBeenCalledWith('Erro', motivo);
      expect(tela.getByText('Rodoviária do Plano Piloto')).toBeTruthy();
    });
  });
});
