import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ResultadoTrajetoScreen from '../screens/ResultadoTrajetoScreen';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
});

const OPCOES = [
  { duracaoMinutos: 25, partida: '08:00', chegada: '08:25', baldeacoes: 0 },
  { duracaoMinutos: 40, partida: '08:10', chegada: '08:50', baldeacoes: 2 },
  { duracaoMinutos: 55, partida: '08:20', chegada: '09:15', baldeacoes: 3 },
];

// -----testes------
describe('ResultadoTrajetoScreen', () => {
  const navigation = { navigate: jest.fn() };

  const renderTela = (opcoes = OPCOES) =>
    render(<ResultadoTrajetoScreen route={{ params: { opcoes } }} navigation={navigation} />);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('renderização', () => {
    it('mostra o título da tela', () => {
      const { getByText } = renderTela();

      expect(getByText('Opções Encontradas')).toBeTruthy();
    });

    it('mostra um card para cada opção recebida', () => {
      const { getAllByText } = renderTela();

      expect(getAllByText(/ min$/)).toHaveLength(OPCOES.length);
    });

    it('mostra a duração e o horário de cada opção', () => {
      const { getByText } = renderTela();

      expect(getByText('25 min')).toBeTruthy();
      expect(getByText('08:00 - 08:25')).toBeTruthy();
      expect(getByText('40 min')).toBeTruthy();
      expect(getByText('08:10 - 08:50')).toBeTruthy();
      expect(getByText('55 min')).toBeTruthy();
      expect(getByText('08:20 - 09:15')).toBeTruthy();
    });

    it('mostra "Direto" quando não há baldeações', () => {
      const { getByText } = renderTela();

      expect(getByText('Direto')).toBeTruthy();
    });

    it('mostra a quantidade de baldeações quando há troca de linha', () => {
      const { getByText } = renderTela();

      expect(getByText('2 baldeações')).toBeTruthy();
      expect(getByText('3 baldeações')).toBeTruthy();
    });

    it('mantém a ordem em que as opções foram recebidas', () => {
      const { getAllByText } = renderTela();

      const duracoes = getAllByText(/ min$/).map((no) => no.props.children);

      expect(duracoes).toEqual(['25 min', '40 min', '55 min']);
    });

    it('formata durações iguais ou superiores a 60 minutos em horas e minutos', () => {
      const { getByText } = renderTela([
        { duracaoMinutos: 60, partida: '08:00', chegada: '09:00', baldeacoes: 0 },
        { duracaoMinutos: 90, partida: '08:00', chegada: '09:30', baldeacoes: 1 },
        { duracaoMinutos: 125, partida: '08:00', chegada: '10:05', baldeacoes: 1 },
      ]);

      expect(getByText('1h')).toBeTruthy();
      expect(getByText('1h 30min')).toBeTruthy();
      expect(getByText('2h 05min')).toBeTruthy();
    });

    it('mostra uma única opção quando só há uma', () => {
      const { getAllByText, getByText } = renderTela([OPCOES[0]]);

      expect(getAllByText(/ min$/)).toHaveLength(1);
      expect(getByText('Direto')).toBeTruthy();
    });

    it('mostra só o título quando não há opções', () => {
      const { getByText, queryAllByText } = renderTela([]);

      expect(getByText('Opções Encontradas')).toBeTruthy();
      expect(queryAllByText(/ min$/)).toHaveLength(0);
    });

    it('destaca opções de trajeto afetadas por alertas vigentes (RF14)', () => {
      const { getByText } = renderTela([
        {
          ...OPCOES[0],
          afetadaPorAlerta: true,
          alertas: [{ id: 1, tipo: 'DESVIO', titulo: 'Desvio na W3 Sul', descricao: 'Obras na via' }],
        },
        { ...OPCOES[1], afetadaPorAlerta: false, alertas: [] },
      ]);

      expect(getByText('⚠ Alerta: Desvio')).toBeTruthy();
      expect(getByText('Desvio na W3 Sul')).toBeTruthy();
    });

    it('exibe resumo do trajeto e estrela para favoritar quando origem e destino são informados (RF17)', () => {
      const { getByText, getByLabelText } = render(
        <ResultadoTrajetoScreen
          route={{ params: { opcoes: OPCOES, origem: 'Asa Sul', destino: 'Rodoviária' } }}
          navigation={navigation}
        />
      );

      expect(getByText('Asa Sul → Rodoviária')).toBeTruthy();
      expect(getByLabelText('Adicionar aos favoritos')).toBeTruthy();
    });

    it('exibe o selo do planejamento por horário quando informado na rota (RF06)', () => {
      const { getByText } = render(
        <ResultadoTrajetoScreen
          route={{
            params: {
              opcoes: OPCOES,
              origem: 'Asa Sul',
              destino: 'Rodoviária',
              planejamentoHorario: { referenciaHorario: 'CHEGADA', horario: '09:00' },
            },
          }}
          navigation={navigation}
        />
      );

      expect(getByText('Planejamento: Chegada até 09:00')).toBeTruthy();
    });
  });

  describe('navegação', () => {
    it('ao tocar em uma opção, abre o detalhe dela', () => {
      const { getByText } = renderTela();

      fireEvent.press(getByText('40 min'));

      expect(navigation.navigate).toHaveBeenCalledTimes(1);
      expect(navigation.navigate).toHaveBeenCalledWith('TrajetoDetalhe', {
        opcaoTrajeto: OPCOES[1],
      });
    });

    it('abre o detalhe da opção tocada, e não de outra', () => {
      const { getByText } = renderTela();

      fireEvent.press(getByText('55 min'));
      fireEvent.press(getByText('25 min'));

      expect(navigation.navigate).toHaveBeenNthCalledWith(1, 'TrajetoDetalhe', {
        opcaoTrajeto: OPCOES[2],
      });
      expect(navigation.navigate).toHaveBeenNthCalledWith(2, 'TrajetoDetalhe', {
        opcaoTrajeto: OPCOES[0],
      });
    });

    it('não navega ao renderizar a tela', () => {
      renderTela();

      expect(navigation.navigate).not.toHaveBeenCalled();
    });
  });
});