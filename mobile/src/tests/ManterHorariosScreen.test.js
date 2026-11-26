import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ManterHorariosScreen from '../screens/ManterHorariosScreen';
import { listarPartidasAdmin, incluirPartida, alterarPartida, excluirPartida } from '../services/api';
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
  listarPartidasAdmin: jest.fn(),
  incluirPartida: jest.fn(),
  alterarPartida: jest.fn(),
  excluirPartida: jest.fn(),
}));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
  confirmarAcao: jest.fn(),
}));

const TOKEN = 'token-admin';
const LINHA = { id: '2302', codigo: '2302', nome: 'Santa Maria/Rodoviária' };
const PARTIDAS = [
  { viagemId: 'TRIP_1', horario: '05:01' },
  { viagemId: 'TRIP_2', horario: '05:14' },
];

// -----testes------
describe('ManterHorariosScreen', () => {
  const renderTela = () => render(<ManterHorariosScreen route={{ params: { linha: LINHA } }} />);

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

  describe('lista de partidas', () => {
    it('mostra o indicador enquanto carrega as partidas', () => {
      listarPartidasAdmin.mockReturnValue(new Promise(() => {}));
      const { UNSAFE_getByType } = renderTela();

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('mostra a linha e carrega as partidas de ida em dias úteis', async () => {
      listarPartidasAdmin.mockResolvedValue(PARTIDAS);
      const { findByText, getByText } = renderTela();

      expect(await findByText('05:01')).toBeTruthy();
      expect(getByText('05:14')).toBeTruthy();
      expect(getByText('2302')).toBeTruthy();
      expect(getByText('Santa Maria/Rodoviária')).toBeTruthy();
      expect(listarPartidasAdmin).toHaveBeenCalledWith(TOKEN, '2302', 'IDA', 'DIA_UTIL');
    });

    it('recarrega ao trocar o sentido e o tipo de dia', async () => {
      listarPartidasAdmin.mockResolvedValue(PARTIDAS);
      const { findByText, getByText } = renderTela();
      await findByText('05:01');

      fireEvent.press(getByText('Volta'));
      await waitFor(() => expect(listarPartidasAdmin).toHaveBeenLastCalledWith(TOKEN, '2302', 'VOLTA', 'DIA_UTIL'));

      fireEvent.press(getByText('Sábados'));
      await waitFor(() => expect(listarPartidasAdmin).toHaveBeenLastCalledWith(TOKEN, '2302', 'VOLTA', 'SABADO'));
    });

    it('mostra a mensagem quando não há partidas', async () => {
      listarPartidasAdmin.mockResolvedValue([]);
      const { findByText } = renderTela();

      expect(await findByText('Nenhuma partida neste sentido e tipo de dia.')).toBeTruthy();
    });

    it('avisa quando não consegue carregar as partidas', async () => {
      listarPartidasAdmin.mockRejectedValue(new Error('Network Error'));
      const { findByText } = renderTela();

      await findByText('Nenhuma partida neste sentido e tipo de dia.');
      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível carregar as partidas.');
    });
  });

  describe('inclusão', () => {
    it('inclui a partida no sentido e tipo de dia escolhidos e recarrega a lista', async () => {
      listarPartidasAdmin.mockResolvedValue(PARTIDAS);
      incluirPartida.mockResolvedValue({ viagemId: 'MANUAL_1', horario: '05:07' });
      const { findByText, getByText, getByPlaceholderText } = renderTela();
      await findByText('05:01');

      fireEvent.changeText(getByPlaceholderText('Ex.: 05:30'), '05:07');
      fireEvent.press(getByText('Incluir partida'));

      await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Pronto', 'Partida incluída.'));
      expect(incluirPartida).toHaveBeenCalledWith(TOKEN, '2302', { sentido: 'IDA', tipoDia: 'DIA_UTIL', horario: '05:07' });
      await waitFor(() => expect(listarPartidasAdmin).toHaveBeenCalledTimes(2));
      expect(getByPlaceholderText('Ex.: 05:30').props.value).toBe('');
    });

    it('mostra o erro da API e mantém o horário digitado', async () => {
      const mensagem = 'Já existe uma partida às 05:01 neste sentido e tipo de dia.';
      listarPartidasAdmin.mockResolvedValue(PARTIDAS);
      incluirPartida.mockRejectedValue({ response: { data: { detalhes: mensagem } } });
      const { findByText, getByText, getByPlaceholderText } = renderTela();
      await findByText('05:01');

      fireEvent.changeText(getByPlaceholderText('Ex.: 05:30'), '05:01');
      fireEvent.press(getByText('Incluir partida'));

      await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Erro', mensagem));
      expect(getByPlaceholderText('Ex.: 05:30').props.value).toBe('05:01');
    });
  });

  describe('alteração', () => {
    it('"Alterar" preenche o horário e salva a mudança da partida escolhida', async () => {
      listarPartidasAdmin.mockResolvedValue(PARTIDAS);
      alterarPartida.mockResolvedValue({ viagemId: 'TRIP_1', horario: '05:03' });
      const { findByText, getAllByText, getByText, getByPlaceholderText } = renderTela();
      await findByText('05:01');

      fireEvent.press(getAllByText('Alterar')[0]);
      expect(getByText('Novo horário para a partida das 05:01')).toBeTruthy();
      expect(getByPlaceholderText('Ex.: 05:30').props.value).toBe('05:01');

      fireEvent.changeText(getByPlaceholderText('Ex.: 05:30'), '05:03');
      fireEvent.press(getByText('Salvar alteração'));

      await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Pronto', 'Partida alterada.'));
      expect(alterarPartida).toHaveBeenCalledWith(TOKEN, '2302', 'TRIP_1', { horario: '05:03' });
      expect(incluirPartida).not.toHaveBeenCalled();
      expect(getByText('Incluir partida')).toBeTruthy();
    });

    it('"Cancelar alteração" volta para a inclusão', async () => {
      listarPartidasAdmin.mockResolvedValue(PARTIDAS);
      const { findByText, getAllByText, getByText, getByPlaceholderText, queryByText } = renderTela();
      await findByText('05:01');

      fireEvent.press(getAllByText('Alterar')[1]);
      fireEvent.press(getByText('Cancelar alteração'));

      expect(getByText('Incluir partida')).toBeTruthy();
      expect(queryByText('Cancelar alteração')).toBeNull();
      expect(getByPlaceholderText('Ex.: 05:30').props.value).toBe('');
    });
  });

  describe('exclusão', () => {
    it('pede confirmação antes de excluir a partida', async () => {
      listarPartidasAdmin.mockResolvedValue(PARTIDAS);
      const { findByText, getAllByText } = renderTela();
      await findByText('05:01');

      fireEvent.press(getAllByText('Excluir')[0]);

      expect(confirmarAcao).toHaveBeenCalledWith(
        'Excluir partida',
        'A partida das 05:01 será excluída com todos os horários dessa viagem.',
        'Excluir',
        expect.any(Function)
      );
      expect(excluirPartida).not.toHaveBeenCalled();
    });

    it('ao confirmar, exclui a viagem e recarrega a lista', async () => {
      listarPartidasAdmin.mockResolvedValueOnce(PARTIDAS).mockResolvedValueOnce([PARTIDAS[1]]);
      excluirPartida.mockResolvedValue({ mensagem: 'Partida excluída.' });
      const { findByText, getAllByText, queryByText } = renderTela();
      await findByText('05:01');

      fireEvent.press(getAllByText('Excluir')[0]);
      await confirmar();

      expect(excluirPartida).toHaveBeenCalledWith(TOKEN, '2302', 'TRIP_1');
      await waitFor(() => expect(queryByText('05:01')).toBeNull());
    });

    it('mostra o erro da API quando a exclusão falha', async () => {
      listarPartidasAdmin.mockResolvedValue(PARTIDAS);
      excluirPartida.mockRejectedValue({ response: { data: { detalhes: 'Partida não encontrada.' } } });
      const { findByText, getAllByText } = renderTela();
      await findByText('05:01');

      fireEvent.press(getAllByText('Excluir')[0]);
      await confirmar();

      expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Partida não encontrada.');
    });
  });
});
