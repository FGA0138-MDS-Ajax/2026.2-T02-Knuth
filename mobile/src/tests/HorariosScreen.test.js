import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HorariosScreen from '../screens/HorariosScreen';
import { getHorarios } from '../services/api';

jest.setTimeout(15000);

jest.mock('../services/api', () => ({
  getHorarios: jest.fn(),
}));

const LINHA = {
  codigo: '0.111',
  nome: 'Rodoviária / Asa Sul',
  quadroHorarios: {
    IDA: {
      DIA_UTIL: ['05:30', '06:00', '06:30'],
      SABADO: ['07:00', '08:00'],
      DOMINGO_FERIADO: ['09:00'],
    },
    VOLTA: {
      DIA_UTIL: ['17:30', '18:00'],
      SABADO: ['19:00'],
      DOMINGO_FERIADO: ['20:00'],
    },
  },
};

const MSG_VAZIO = 'Nenhum horário encontrado para esta seleção.';

// -----testes------
describe('HorariosScreen', () => {
  const navigation = { navigate: jest.fn() };
  let erroSpy;

  const rotaDaLinha = (linhaId) => ({ params: { linhaId } });

  const renderTela = (linhaId = 1) =>
    render(<HorariosScreen route={rotaDaLinha(linhaId)} navigation={navigation} />);

  const renderCarregada = async (linhaId = 1) => {
    getHorarios.mockResolvedValue(LINHA);
    const tela = renderTela(linhaId);
    await waitFor(() => expect(getHorarios).toHaveBeenCalled());
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
    it('mostra o indicador e a mensagem enquanto busca os horários', () => {
      getHorarios.mockReturnValue(new Promise(() => {}));
      const { getByText, queryByText, UNSAFE_getByType } = renderTela();

      expect(getByText('Carregando horários...')).toBeTruthy();
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
      expect(queryByText('Ver itinerário')).toBeNull();
    });

    it('busca os horários da linha recebida pela rota', async () => {
      await renderCarregada(5);

      expect(getHorarios).toHaveBeenCalledTimes(1);
      expect(getHorarios).toHaveBeenCalledWith(5);
    });

    it('usa a linha 1 quando a rota não traz parâmetros', async () => {
      getHorarios.mockResolvedValue(LINHA);
      const { findByText } = render(<HorariosScreen navigation={navigation} />);

      await findByText(LINHA.codigo);

      expect(getHorarios).toHaveBeenCalledWith(1);
    });

    it('busca de novo quando a linha da rota muda', async () => {
      getHorarios
        .mockResolvedValueOnce(LINHA)
        .mockResolvedValueOnce({ ...LINHA, codigo: '0.222', nome: 'Outra Linha' });
      const { findByText, rerender } = renderTela(1);
      await findByText(LINHA.codigo);

      rerender(<HorariosScreen route={rotaDaLinha(2)} navigation={navigation} />);

      expect(await findByText('0.222')).toBeTruthy();
      expect(getHorarios).toHaveBeenLastCalledWith(2);
    });

    it('sai do carregamento depois de receber os dados', async () => {
      const { queryByText, UNSAFE_queryByType } = await renderCarregada();

      expect(queryByText('Carregando horários...')).toBeNull();
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });
  });

  describe('cabeçalho', () => {
    it('mostra o código e o nome da linha', async () => {
      const { getByText } = await renderCarregada();

      expect(getByText('0.111')).toBeTruthy();
      expect(getByText('Rodoviária / Asa Sul')).toBeTruthy();
    });

    it('mostra valores padrão quando a API devolve resposta nula', async () => {
      getHorarios.mockResolvedValue(null);
      const { findByText } = renderTela();

      expect(await findByText('---')).toBeTruthy();
      expect(await findByText('Linha')).toBeTruthy();
      expect(await findByText(MSG_VAZIO)).toBeTruthy();
    });
  });

  describe('horários exibidos', () => {
    it('começa em "Ida" nos dias úteis', async () => {
      const { getByText, queryByText } = await renderCarregada();

      expect(getByText('05:30')).toBeTruthy();
      expect(getByText('06:00')).toBeTruthy();
      expect(getByText('06:30')).toBeTruthy();
      expect(queryByText('07:00')).toBeNull();
      expect(queryByText('17:30')).toBeNull();
    });

    it('"Volta" mostra os horários de volta', async () => {
      const { getByText, queryByText } = await renderCarregada();

      fireEvent.press(getByText('Volta'));

      expect(getByText('17:30')).toBeTruthy();
      expect(getByText('18:00')).toBeTruthy();
      expect(queryByText('05:30')).toBeNull();
    });

    it('"Sábados" mostra os horários de sábado', async () => {
      const { getByText, queryByText } = await renderCarregada();

      fireEvent.press(getByText('Sábados'));

      expect(getByText('07:00')).toBeTruthy();
      expect(getByText('08:00')).toBeTruthy();
      expect(queryByText('05:30')).toBeNull();
    });

    it('"Dom/Fer." mostra os horários de domingos e feriados', async () => {
      const { getByText, queryByText } = await renderCarregada();

      fireEvent.press(getByText('Dom/Fer.'));

      expect(getByText('09:00')).toBeTruthy();
      expect(queryByText('05:30')).toBeNull();
    });

    it('combina o sentido e o tipo de dia escolhidos', async () => {
      const { getByText, queryByText } = await renderCarregada();

      fireEvent.press(getByText('Volta'));
      fireEvent.press(getByText('Sábados'));

      expect(getByText('19:00')).toBeTruthy();
      expect(queryByText('17:30')).toBeNull();
      expect(queryByText('07:00')).toBeNull();
    });

    it('volta a mostrar os horários de dias úteis ao tocar em "Dias úteis"', async () => {
      const { getByText } = await renderCarregada();

      fireEvent.press(getByText('Sábados'));
      fireEvent.press(getByText('Dias úteis'));

      expect(getByText('05:30')).toBeTruthy();
    });

    it('mostra a mensagem de vazio quando a seleção não tem horários', async () => {
      getHorarios.mockResolvedValue({
        ...LINHA,
        quadroHorarios: { ...LINHA.quadroHorarios, VOLTA: { DIA_UTIL: ['17:30'] } },
      });
      const { findByText, getByText, queryByText } = renderTela();
      await findByText(LINHA.codigo);

      fireEvent.press(getByText('Volta'));
      fireEvent.press(getByText('Sábados'));

      expect(getByText(MSG_VAZIO)).toBeTruthy();
      expect(queryByText('17:30')).toBeNull();
    });

    it('mostra a mensagem de vazio quando a linha não tem quadro de horários', async () => {
      getHorarios.mockResolvedValue({ codigo: '0.333', nome: 'Sem Quadro' });
      const { findByText } = renderTela();

      expect(await findByText(MSG_VAZIO)).toBeTruthy();
    });
  });

  describe('navegação', () => {
    it('"Ver itinerário" abre o itinerário da linha', async () => {
      const { getByText } = await renderCarregada(5);

      fireEvent.press(getByText('Ver itinerário'));

      expect(navigation.navigate).toHaveBeenCalledWith('Itinerario', { linhaId: 5 });
    });

    it('"Reportar divergência" abre a tela de reporte preenchida com HORARIO e código da linha', async () => {
      const { getByText } = await renderCarregada(5);

      fireEvent.press(getByText('Reportar divergência'));

      expect(navigation.navigate).toHaveBeenCalledWith('ReportarDivergencia', {
        tipo: 'HORARIO',
        linhaId: LINHA.codigo,
      });
    });
  });

  describe('sinalização de alertas (RF14)', () => {
    it('exibe banner de alerta quando a linha possui alertas vigentes e navega para Alertas ao tocar', async () => {
      getHorarios.mockResolvedValue({
        ...LINHA,
        afetadaPorAlerta: true,
        alertas: [
          {
            id: 1,
            tipo: 'ALTERACAO_HORARIO',
            titulo: 'Intervalo alterado',
            descricao: 'Saídas a cada 30 minutos hoje.',
          },
        ],
      });
      const { findByText, getByText } = renderTela();

      expect(await findByText('⚠ Alerta vigente')).toBeTruthy();
      expect(getByText('Alteração de Horário — Intervalo alterado')).toBeTruthy();
      expect(getByText('Saídas a cada 30 minutos hoje.')).toBeTruthy();

      fireEvent.press(getByText('Ver detalhes ›'));
      expect(navigation.navigate).toHaveBeenCalledWith('Alertas');
    });
  });

  describe('erro ao carregar', () => {
    it('registra o erro, sai do carregamento e mostra a tela sem dados', async () => {
      getHorarios.mockRejectedValue(new Error('Network Error'));
      const { findByText, getByText, queryByText } = renderTela();

      expect(await findByText(MSG_VAZIO)).toBeTruthy();
      expect(getByText('---')).toBeTruthy();
      expect(getByText('Linha')).toBeTruthy();
      expect(queryByText('Carregando horários...')).toBeNull();
      await waitFor(() =>
        expect(erroSpy).toHaveBeenCalledWith('Erro ao carregar horários:', expect.any(Error))
      );
    });
  });
});