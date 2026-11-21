import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ItinerarioScreen from '../screens/ItinerarioScreen';
import { getItinerario } from '../services/api';

jest.mock('../services/api', () => ({
  getItinerario: jest.fn(),
}));

const LINHA = {
  codigo: '0.111',
  nome: 'Rodoviária / Asa Sul',
  itinerario: {
    IDA: [
      { sequencia: 1, paradaId: 10, nome: 'Rodoviária do Plano Piloto', codigo: 'P-101' },
      { sequencia: 2, paradaId: 11, nome: 'W3 Sul Quadra 502', codigo: 'P-102' },
      { sequencia: 3, paradaId: 12, nome: 'Asa Sul Quadra 704', codigo: 'P-103' },
    ],
    VOLTA: [
      { sequencia: 1, paradaId: 12, nome: 'Asa Sul Quadra 704', codigo: 'P-103' },
      { sequencia: 2, paradaId: 10, nome: 'Rodoviária do Plano Piloto', codigo: 'P-101' },
    ],
  },
};

const MSG_ERRO = 'Não foi possível carregar o itinerário.';
const MSG_VAZIO = 'Nenhuma parada neste sentido.';

// -----testes------
describe('ItinerarioScreen', () => {
  let erroSpy;

  const rotaDaLinha = (linhaId) => ({ params: { linhaId } });

  const renderTela = (linhaId = 1) => render(<ItinerarioScreen route={rotaDaLinha(linhaId)} />);

  const renderCarregada = async (linhaId = 1) => {
    getItinerario.mockResolvedValue(LINHA);
    const tela = renderTela(linhaId);
    await tela.findByText(LINHA.codigo);
    return tela;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('carregamento', () => {
    it('mostra o indicador e os valores provisórios enquanto busca o itinerário', () => {
      getItinerario.mockReturnValue(new Promise(() => {}));
      const { getByText, queryByText, UNSAFE_getByType } = renderTela();

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
      expect(getByText('---')).toBeTruthy();
      expect(getByText('Carregando...')).toBeTruthy();
      expect(queryByText(MSG_VAZIO)).toBeNull();
      expect(queryByText(MSG_ERRO)).toBeNull();
    });

    it('busca o itinerário da linha recebida pela rota', async () => {
      await renderCarregada(5);

      expect(getItinerario).toHaveBeenCalledTimes(1);
      expect(getItinerario).toHaveBeenCalledWith(5);
    });

    it('esconde o indicador depois de receber os dados', async () => {
      const { UNSAFE_queryByType, queryByText } = await renderCarregada();

      expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
      expect(queryByText('Carregando...')).toBeNull();
    });

    it('busca de novo quando a linha da rota muda', async () => {
      getItinerario
        .mockResolvedValueOnce(LINHA)
        .mockResolvedValueOnce({ ...LINHA, codigo: '0.222', nome: 'Outra Linha' });
      const { findByText, rerender } = renderTela(1);
      await findByText(LINHA.codigo);

      rerender(<ItinerarioScreen route={rotaDaLinha(2)} />);

      expect(await findByText('0.222')).toBeTruthy();
      expect(getItinerario).toHaveBeenLastCalledWith(2);
    });
  });

  describe('cabeçalho', () => {
    it('mostra o código e o nome da linha', async () => {
      const { getByText } = await renderCarregada();

      expect(getByText('0.111')).toBeTruthy();
      expect(getByText('Rodoviária / Asa Sul')).toBeTruthy();
    });

    it('mantém os valores padrão quando a resposta não traz código nem nome', async () => {
      getItinerario.mockResolvedValue({});
      const { findByText, getByText } = renderTela();

      expect(await findByText(MSG_VAZIO)).toBeTruthy();
      expect(getByText('---')).toBeTruthy();
      expect(getByText('Carregando...')).toBeTruthy();
    });
  });

  describe('paradas', () => {
    it('começa em "Ida" com nome, código e sequência de cada parada', async () => {
      const { getByText, queryByText } = await renderCarregada();

      expect(getByText('Rodoviária do Plano Piloto')).toBeTruthy();
      expect(getByText('W3 Sul Quadra 502')).toBeTruthy();
      expect(getByText('Asa Sul Quadra 704')).toBeTruthy();
      expect(getByText('Parada P-101')).toBeTruthy();
      expect(getByText('Parada P-102')).toBeTruthy();
      expect(getByText('Parada P-103')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
      expect(queryByText(MSG_VAZIO)).toBeNull();
    });

    it('"Volta" mostra somente as paradas do sentido de volta', async () => {
      const { getByText, queryByText } = await renderCarregada();

      fireEvent.press(getByText('Volta'));

      expect(getByText('Asa Sul Quadra 704')).toBeTruthy();
      expect(getByText('Rodoviária do Plano Piloto')).toBeTruthy();
      expect(queryByText('W3 Sul Quadra 502')).toBeNull();
      expect(queryByText('3')).toBeNull();
    });

    it('"Ida" volta a mostrar as paradas de ida', async () => {
      const { getByText } = await renderCarregada();

      fireEvent.press(getByText('Volta'));
      fireEvent.press(getByText('Ida'));

      expect(getByText('W3 Sul Quadra 502')).toBeTruthy();
    });

    it('mostra a mensagem de vazio quando o sentido escolhido não tem paradas', async () => {
      getItinerario.mockResolvedValue({ ...LINHA, itinerario: { IDA: LINHA.itinerario.IDA } });
      const { findByText, getByText, queryByText } = renderTela();
      await findByText(LINHA.codigo);

      fireEvent.press(getByText('Volta'));

      expect(getByText(MSG_VAZIO)).toBeTruthy();
      expect(queryByText('W3 Sul Quadra 502')).toBeNull();
    });

    it('sinaliza alertas na linha e nas paradas afetadas do itinerário (RF14)', async () => {
      getItinerario.mockResolvedValue({
        ...LINHA,
        afetadaPorAlerta: true,
        alertas: [{ id: 1, tipo: 'DESVIO', descricao: 'Desvio no percurso principal.' }],
        itinerario: {
          ...LINHA.itinerario,
          IDA: [
            {
              ...LINHA.itinerario.IDA[0],
              afetadaPorAlerta: true,
              alertas: [{ id: 2, tipo: 'SUSPENSAO', descricao: 'Parada interditada para obras.' }],
            },
            LINHA.itinerario.IDA[1],
          ],
        },
      });
      const { findByText, getByText } = renderTela();

      expect(await findByText('⚠ Alerta vigente')).toBeTruthy();
      expect(getByText('Desvio no percurso principal.')).toBeTruthy();
      expect(getByText('⚠ Alerta: Suspensão')).toBeTruthy();
      expect(getByText('Parada interditada para obras.')).toBeTruthy();
    });
  });

  describe('erro ao carregar', () => {
    it('mostra a mensagem de erro e esconde o indicador', async () => {
      getItinerario.mockRejectedValue(new Error('Network Error'));
      const { findByText, queryByText, UNSAFE_queryByType } = renderTela();

      expect(await findByText(MSG_ERRO)).toBeTruthy();
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
      expect(queryByText(MSG_VAZIO)).toBeNull();
    });

    it('registra o erro no console', async () => {
      getItinerario.mockRejectedValue(new Error('Network Error'));
      const { findByText } = renderTela();
      await findByText(MSG_ERRO);

      await waitFor(() =>
        expect(erroSpy).toHaveBeenCalledWith('Erro ao carregar itinerário:', expect.any(Error))
      );
    });
  });

  describe('reporte de divergência (RF19)', () => {
    it('"Reportar divergência" navega com tipo ITINERARIO e código da linha', async () => {
      const navigation = { navigate: jest.fn() };
      getItinerario.mockResolvedValue(LINHA);
      const { findByText, getByText } = render(
        <ItinerarioScreen route={rotaDaLinha(5)} navigation={navigation} />
      );
      await findByText(LINHA.codigo);

      fireEvent.press(getByText('Reportar divergência'));

      expect(navigation.navigate).toHaveBeenCalledWith('ReportarDivergencia', {
        tipo: 'ITINERARIO',
        linhaId: LINHA.codigo,
      });
    });

    it('"Reportar" em uma parada navega com tipo PARADA, linha e código da parada', async () => {
      const navigation = { navigate: jest.fn() };
      getItinerario.mockResolvedValue(LINHA);
      const { findByText, getAllByText } = render(
        <ItinerarioScreen route={rotaDaLinha(5)} navigation={navigation} />
      );
      await findByText('Rodoviária do Plano Piloto');

      fireEvent.press(getAllByText('Reportar')[0]);

      expect(navigation.navigate).toHaveBeenCalledWith('ReportarDivergencia', {
        tipo: 'PARADA',
        linhaId: LINHA.codigo,
        paradaId: 'P-101',
      });
    });
  });
});