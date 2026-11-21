import React from 'react';
import { render } from '@testing-library/react-native';
import TrajetoDetalheScreen from '../screens/TrajetoDetalheScreen';

const OPCAO = {
  duracaoMinutos: 45,
  partida: '08:00',
  chegada: '08:45',
  etapas: [
    { ordem: 1, tipo: 'CAMINHADA', instrucao: 'Caminhe até a parada Rodoviária', duracaoMinutos: 5 },
    { ordem: 2, tipo: 'ONIBUS', instrucao: 'Pegue a linha 0.111 sentido Asa Sul', duracaoMinutos: 30 },
    { ordem: 3, tipo: 'CAMINHADA', instrucao: 'Caminhe até Quadra 704', duracaoMinutos: 10 },
  ],
};

// -----testes------
describe('TrajetoDetalheScreen', () => {
  const renderTela = (opcaoTrajeto = OPCAO) =>
    render(<TrajetoDetalheScreen route={{ params: { opcaoTrajeto } }} />);

  describe('cabeçalho', () => {
    it('mostra a duração total do trajeto', () => {
      const { getByText } = renderTela();

      expect(getByText('45 min')).toBeTruthy();
    });

    it('formata duração total e etapas >= 60 min em horas e minutos', () => {
      const { getByText } = renderTela({
        ...OPCAO,
        duracaoMinutos: 95,
        etapas: [
          { ordem: 1, tipo: 'ONIBUS', instrucao: 'Trecho longo', duracaoMinutos: 75 },
          { ordem: 2, tipo: 'CAMINHADA', instrucao: 'Espera', duracaoMinutos: 20 },
        ],
      });

      expect(getByText('1h 35min')).toBeTruthy();
      expect(getByText('1h 15min')).toBeTruthy();
      expect(getByText('20 min')).toBeTruthy();
    });

    it('mostra os horários de partida e chegada', () => {
      const { getByText } = renderTela();

      expect(getByText('Partida: 08:00 | Chegada: 08:45')).toBeTruthy();
    });

    it('mostra o título do passo a passo', () => {
      const { getByText } = renderTela();

      expect(getByText('Passo a passo:')).toBeTruthy();
    });
  });

  describe('etapas', () => {
    it('mostra a instrução de cada etapa', () => {
      const { getByText } = renderTela();

      expect(getByText('Caminhe até a parada Rodoviária')).toBeTruthy();
      expect(getByText('Pegue a linha 0.111 sentido Asa Sul')).toBeTruthy();
      expect(getByText('Caminhe até Quadra 704')).toBeTruthy();
    });

    it('mostra a duração de cada etapa', () => {
      const { getByText } = renderTela();

      expect(getByText('5 min')).toBeTruthy();
      expect(getByText('30 min')).toBeTruthy();
      expect(getByText('10 min')).toBeTruthy();
    });

    it('mantém a ordem em que as etapas foram recebidas', () => {
      const { getAllByText } = renderTela();

      const instrucoes = getAllByText(/^(Caminhe|Pegue)/).map((no) => no.props.children);

      expect(instrucoes).toEqual([
        'Caminhe até a parada Rodoviária',
        'Pegue a linha 0.111 sentido Asa Sul',
        'Caminhe até Quadra 704',
      ]);
    });

    it('mostra o ícone de ônibus nas etapas de ônibus e o de caminhada nas demais', () => {
      const { getAllByText } = renderTela();

      expect(getAllByText('🚌')).toHaveLength(1);
      expect(getAllByText('🚶')).toHaveLength(2);
    });

    it('trata um tipo de etapa desconhecido como caminhada', () => {
      const { queryByText, getAllByText } = renderTela({
        ...OPCAO,
        etapas: [{ ordem: 1, tipo: 'METRO', instrucao: 'Pegue o metrô', duracaoMinutos: 20 }],
      });

      expect(queryByText('🚌')).toBeNull();
      expect(getAllByText('🚶')).toHaveLength(1);
    });

    it('mostra uma única etapa quando o trajeto só tem uma', () => {
      const { getByText, queryByText } = renderTela({
        ...OPCAO,
        etapas: [OPCAO.etapas[1]],
      });

      expect(getByText('Pegue a linha 0.111 sentido Asa Sul')).toBeTruthy();
      expect(queryByText('Caminhe até a parada Rodoviária')).toBeNull();
    });

    it('mostra só o cabeçalho quando o trajeto não tem etapas', () => {
      const { getByText, queryByText } = renderTela({ ...OPCAO, etapas: [] });

      expect(getByText('45 min')).toBeTruthy();
      expect(getByText('Passo a passo:')).toBeTruthy();
      expect(queryByText('🚌')).toBeNull();
      expect(queryByText('🚶')).toBeNull();
    });

    it('exibe banner de alertas vigentes quando o trajeto é afetado por alerta (RF14)', () => {
      const { getByText } = renderTela({
        ...OPCAO,
        afetadaPorAlerta: true,
        alertas: [{ id: 1, tipo: 'DESVIO', descricao: 'Desvio temporário na W3 Sul.' }],
      });

      expect(getByText('⚠ Alerta vigente')).toBeTruthy();
      expect(getByText('Desvio temporário na W3 Sul.')).toBeTruthy();
    });
  });
});