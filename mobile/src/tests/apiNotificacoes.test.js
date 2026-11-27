import axios from 'axios';
import {
  getNotificacoes,
  getNotificacoesNaoLidas,
  marcarNotificacaoLida
} from '../services/api';

jest.mock('axios');

const cabecalho = { headers: { Authorization: 'Bearer abc' } };

describe('api de notificações', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('busca as notificações do passageiro', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 1 }] });

    const resultado = await getNotificacoes('abc');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/notificacoes$/),
      cabecalho
    );
    expect(resultado).toEqual([{ id: 1 }]);
  });

  it('busca a quantidade de notificações não lidas', async () => {
    axios.get.mockResolvedValue({ data: { naoLidas: 3 } });

    const resultado = await getNotificacoesNaoLidas('abc');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/notificacoes\/nao-lidas$/),
      cabecalho
    );
    expect(resultado).toEqual({ naoLidas: 3 });
  });

  it('marca uma notificação como lida', async () => {
    axios.put.mockResolvedValue({ data: { id: 5, lida: true } });

    const resultado = await marcarNotificacaoLida('abc', 5);

    expect(axios.put).toHaveBeenCalledWith(
      expect.stringMatching(/\/notificacoes\/5\/lida$/),
      {},
      cabecalho
    );
    expect(resultado).toEqual({ id: 5, lida: true });
  });
});
