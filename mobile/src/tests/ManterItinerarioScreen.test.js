import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ManterItinerarioScreen from '../screens/ManterItinerarioScreen';
import {
  getItinerario,
  buscarParadasAdmin,
  incluirParadaNoItinerario,
  removerParadaDoItinerario,
} from '../services/api';
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
  getItinerario: jest.fn(),
  buscarParadasAdmin: jest.fn(),
  incluirParadaNoItinerario: jest.fn(),
  removerParadaDoItinerario: jest.fn(),
}));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
  confirmarAcao: jest.fn(),
}));

const TOKEN = 'token-admin';
const BUSCA = 'Buscar parada por nome ou código (mín. 2 letras)';
const LINHA = { id: '2302', codigo: '2302', nome: 'Santa Maria/Rodoviária' };
const ITINERARIO = {
  itinerario: {
    IDA: [
      { sequencia: 1, paradaId: '7032', nome: 'Terminal BRT Santa Maria' },
      { sequencia: 2, paradaId: '7033', nome: 'Terminal BRT Santa Maria II' },
    ],
    VOLTA: [{ sequencia: 1, paradaId: '3367', nome: 'Rodoviária do Plano Piloto' }],
  },
};
const MORRO_DA_CRUZ = { id: '6710', codigo: '6710', nome: 'Avenida Morro da Cruz' };

// -----testes------
describe('ManterItinerarioScreen', () => {
  const renderTela = () => render(<ManterItinerarioScreen route={{ params: { linha: LINHA } }} />);

  const confirmar = async () => {
    const aoConfirmar = confirmarAcao.mock.calls[0][3];
    await act(async () => {
      await aoConfirmar();
    });
  };

  // Busca e escolhe a parada que vai entrar no itinerário (a busca espera 400 ms depois da digitação)
  const escolherParada = async (tela) => {
    buscarParadasAdmin.mockResolvedValue([MORRO_DA_CRUZ]);
    fireEvent.changeText(tela.getByPlaceholderText(BUSCA), 'morro');
    fireEvent.press(await tela.findByText('Avenida Morro da Cruz (código 6710)'));
  };

  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue(TOKEN);
  });

  describe('itinerário', () => {
    it('mostra o indicador enquanto carrega o itinerário', () => {
      getItinerario.mockReturnValue(new Promise(() => {}));
      const { UNSAFE_getByType } = renderTela();

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('mostra a linha e as paradas de ida em ordem', async () => {
      getItinerario.mockResolvedValue(ITINERARIO);
      const { findByText, getByText } = renderTela();

      expect(await findByText('1. Terminal BRT Santa Maria')).toBeTruthy();
      expect(getByText('2. Terminal BRT Santa Maria II')).toBeTruthy();
      expect(getByText('Santa Maria/Rodoviária')).toBeTruthy();
      expect(getItinerario).toHaveBeenCalledWith('2302');
    });

    it('troca para as paradas de volta', async () => {
      getItinerario.mockResolvedValue(ITINERARIO);
      const { findByText, getByText, queryByText } = renderTela();
      await findByText('1. Terminal BRT Santa Maria');

      fireEvent.press(getByText('Volta'));

      expect(getByText('1. Rodoviária do Plano Piloto')).toBeTruthy();
      expect(queryByText('1. Terminal BRT Santa Maria')).toBeNull();
    });

    it('mostra a lista vazia sem aviso quando a linha não tem itinerário', async () => {
      getItinerario.mockRejectedValue({ response: { status: 404 } });
      const { findByText } = renderTela();

      expect(await findByText('Nenhuma parada neste sentido.')).toBeTruthy();
      expect(mostrarAviso).not.toHaveBeenCalled();
    });

    it('avisa quando não consegue carregar o itinerário', async () => {
      getItinerario.mockRejectedValue(new Error('Network Error'));
      const { findByText } = renderTela();

      await findByText('Nenhuma parada neste sentido.');
      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível carregar o itinerário.');
    });
  });

  describe('inclusão', () => {
    it('busca a parada com o token salvo e mostra a escolhida', async () => {
      getItinerario.mockResolvedValue(ITINERARIO);
      const tela = renderTela();
      await tela.findByText('1. Terminal BRT Santa Maria');

      await escolherParada(tela);

      expect(buscarParadasAdmin).toHaveBeenCalledWith(TOKEN, 'morro');
      expect(tela.getByText('Avenida Morro da Cruz (código 6710)')).toBeTruthy();
      expect(tela.queryByPlaceholderText(BUSCA)).toBeNull();
    });

    it('"Trocar" volta para a busca', async () => {
      getItinerario.mockResolvedValue(ITINERARIO);
      const tela = renderTela();
      await tela.findByText('1. Terminal BRT Santa Maria');
      await escolherParada(tela);

      fireEvent.press(tela.getByText('Trocar'));

      expect(tela.getByPlaceholderText(BUSCA)).toBeTruthy();
    });

    it('pede para escolher a parada antes de incluir', async () => {
      getItinerario.mockResolvedValue(ITINERARIO);
      const { findByText, getAllByText } = renderTela();
      await findByText('1. Terminal BRT Santa Maria');

      fireEvent.press(getAllByText('Incluir depois')[0]);

      expect(mostrarAviso).toHaveBeenCalledWith('Atenção', 'Busque e escolha a parada que vai entrar no itinerário.');
      expect(incluirParadaNoItinerario).not.toHaveBeenCalled();
    });

    it('"Incluir depois" inclui a parada depois da escolhida e recarrega o itinerário', async () => {
      getItinerario.mockResolvedValue(ITINERARIO);
      incluirParadaNoItinerario.mockResolvedValue({ mensagem: 'Parada incluída no itinerário.' });
      const tela = renderTela();
      await tela.findByText('1. Terminal BRT Santa Maria');
      await escolherParada(tela);

      fireEvent.press(tela.getAllByText('Incluir depois')[0]);

      await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Pronto', 'Parada incluída no itinerário.'));
      expect(incluirParadaNoItinerario).toHaveBeenCalledWith(TOKEN, '2302', {
        sentido: 'IDA',
        paradaId: '6710',
        depoisDaSequencia: 1,
      });
      await waitFor(() => expect(getItinerario).toHaveBeenCalledTimes(2));
      expect(tela.getByPlaceholderText(BUSCA)).toBeTruthy();
    });

    it('"Incluir no início" inclui a parada antes da primeira no sentido escolhido', async () => {
      getItinerario.mockResolvedValue(ITINERARIO);
      incluirParadaNoItinerario.mockResolvedValue({});
      const tela = renderTela();
      await tela.findByText('1. Terminal BRT Santa Maria');
      fireEvent.press(tela.getByText('Volta'));
      await escolherParada(tela);

      fireEvent.press(tela.getByText('Incluir no início'));

      await waitFor(() =>
        expect(incluirParadaNoItinerario).toHaveBeenCalledWith(TOKEN, '2302', {
          sentido: 'VOLTA',
          paradaId: '6710',
          depoisDaSequencia: 0,
        })
      );
    });

    it('mostra o erro da API quando a inclusão falha', async () => {
      const mensagem = 'A parada já faz parte do itinerário deste sentido.';
      getItinerario.mockResolvedValue(ITINERARIO);
      incluirParadaNoItinerario.mockRejectedValue({ response: { data: { detalhes: mensagem } } });
      const tela = renderTela();
      await tela.findByText('1. Terminal BRT Santa Maria');
      await escolherParada(tela);

      fireEvent.press(tela.getByText('Incluir no início'));

      await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Erro', mensagem));
    });
  });

  describe('remoção', () => {
    it('pede confirmação antes de remover a parada', async () => {
      getItinerario.mockResolvedValue(ITINERARIO);
      const { findByText, getAllByText } = renderTela();
      await findByText('1. Terminal BRT Santa Maria');

      fireEvent.press(getAllByText('Remover')[0]);

      expect(confirmarAcao).toHaveBeenCalledWith(
        'Remover parada',
        'A parada Terminal BRT Santa Maria sairá do itinerário de ida em todas as viagens. Os horários das outras paradas não mudam.',
        'Remover',
        expect.any(Function)
      );
      expect(removerParadaDoItinerario).not.toHaveBeenCalled();
    });

    it('ao confirmar, remove a parada da posição e recarrega o itinerário', async () => {
      getItinerario.mockResolvedValue(ITINERARIO);
      removerParadaDoItinerario.mockResolvedValue({ mensagem: 'Parada removida do itinerário.' });
      const { findByText, getAllByText } = renderTela();
      await findByText('1. Terminal BRT Santa Maria');

      fireEvent.press(getAllByText('Remover')[1]);
      await confirmar();

      expect(removerParadaDoItinerario).toHaveBeenCalledWith(TOKEN, '2302', 'IDA', 2);
      await waitFor(() => expect(getItinerario).toHaveBeenCalledTimes(2));
    });

    it('mostra o erro da API quando a remoção falha', async () => {
      const mensagem = 'O itinerário precisa ter pelo menos 2 paradas.';
      getItinerario.mockResolvedValue(ITINERARIO);
      removerParadaDoItinerario.mockRejectedValue({ response: { data: { detalhes: mensagem } } });
      const { findByText, getAllByText } = renderTela();
      await findByText('1. Terminal BRT Santa Maria');

      fireEvent.press(getAllByText('Remover')[0]);
      await confirmar();

      expect(mostrarAviso).toHaveBeenCalledWith('Erro', mensagem);
    });
  });
});
