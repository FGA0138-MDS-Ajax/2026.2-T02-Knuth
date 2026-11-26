import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ProximasPartidasScreen from '../screens/ProximasPartidasScreen';
import { getProximasPartidasParada } from '../services/api';

jest.mock('../services/api', () => ({
  getProximasPartidasParada: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
});

jest.mock('../components/FavoritoEstrela', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function FavoritoEstrelaMock() {
    return React.createElement(Text, null, 'estrela-favorito');
  };
});

jest.mock('../components/FavoritosCarregador', () => () => null);

const RESPOSTA_PARTIDAS = {
  parada: {
    id: '3369',
    codigo: 'P-101',
    nome: 'Rodoviária do Plano Piloto',
  },
  tipoDia: 'DIA_UTIL',
  horarioReferencia: '14:10',
  afetadaPorAlerta: false,
  alertas: [],
  mensagem: null,
  partidas: [
    {
      linhaId: 'L1',
      linhaCodigo: '0.111',
      linhaNome: 'Rodoviária / Asa Sul',
      sentido: 'IDA',
      destino: 'Asa Sul',
      horario: '14:10',
      minutosRestantes: 0,
    },
    {
      linhaId: 'L2',
      linhaCodigo: '0.116',
      linhaNome: 'Rodoviária / UnB',
      sentido: 'VOLTA',
      destino: 'Campus Darcy Ribeiro',
      horario: '14:25',
      minutosRestantes: 15,
    },
  ],
};

describe('ProximasPartidasScreen (RF11)', () => {
  let erroSpy;
  let navigation;

  const routePadrao = {
    params: {
      paradaId: '3369',
      paradaNome: 'Rodoviária do Plano Piloto',
      paradaCodigo: 'P-101',
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    navigation = { navigate: jest.fn() };
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  it('exibe indicador de carregamento enquanto busca as próximas partidas', () => {
    getProximasPartidasParada.mockReturnValue(new Promise(() => {}));

    const { UNSAFE_getByType, getByText } = render(
      <ProximasPartidasScreen route={routePadrao} navigation={navigation} />
    );

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(getByText('Rodoviária do Plano Piloto')).toBeTruthy();
    expect(getByText('Parada P-101')).toBeTruthy();
  });

  it('lista as próximas partidas em ordem cronológica com horário e tempo restante', async () => {
    getProximasPartidasParada.mockResolvedValue(RESPOSTA_PARTIDAS);

    const { findByText, getByText } = render(
      <ProximasPartidasScreen route={routePadrao} navigation={navigation} />
    );

    expect(await findByText('0.111')).toBeTruthy();
    expect(getByText('Rodoviária / Asa Sul')).toBeTruthy();
    expect(getByText('14:10')).toBeTruthy();
    expect(getByText('Agora')).toBeTruthy();

    expect(getByText('0.116')).toBeTruthy();
    expect(getByText('Rodoviária / UnB')).toBeTruthy();
    expect(getByText('14:25')).toBeTruthy();
    expect(getByText('em 15 min')).toBeTruthy();
    expect(getByText('A partir de 14:10 • Dia útil')).toBeTruthy();
    expect(getProximasPartidasParada).toHaveBeenCalledWith('3369');
  });

  it('navega para o quadro de horários ao tocar em uma partida', async () => {
    getProximasPartidasParada.mockResolvedValue(RESPOSTA_PARTIDAS);

    const { findByText } = render(
      <ProximasPartidasScreen route={routePadrao} navigation={navigation} />
    );

    const itemLinha = await findByText('Rodoviária / UnB');
    fireEvent.press(itemLinha);

    expect(navigation.navigate).toHaveBeenCalledWith('Horarios', { linhaId: 'L2' });
  });

  it('informa explicitamente quando não há mais partidas previstas para o dia', async () => {
    getProximasPartidasParada.mockResolvedValue({
      ...RESPOSTA_PARTIDAS,
      horarioReferencia: '23:55',
      partidas: [],
      mensagem: 'Não há mais partidas previstas para hoje nesta parada.',
    });

    const { findByText } = render(
      <ProximasPartidasScreen route={routePadrao} navigation={navigation} />
    );

    expect(
      await findByText('Não há mais partidas previstas para hoje nesta parada.')
    ).toBeTruthy();
  });

  it('exibe alertas vigentes da parada quando houver', async () => {
    getProximasPartidasParada.mockResolvedValue({
      ...RESPOSTA_PARTIDAS,
      afetadaPorAlerta: true,
      alertas: [{ id: 9, tipo: 'DESVIO', titulo: 'Desvio na plataforma A', descricao: 'Obras no local' }],
    });

    const { findByText } = render(
      <ProximasPartidasScreen route={routePadrao} navigation={navigation} />
    );

    expect(await findByText(/Desvio na plataforma A/i)).toBeTruthy();
  });

  it('exibe erro e permite tentar novamente quando a API falha', async () => {
    getProximasPartidasParada
      .mockRejectedValueOnce(new Error('falha de rede'))
      .mockResolvedValueOnce(RESPOSTA_PARTIDAS);

    const { findByText, getByText } = render(
      <ProximasPartidasScreen route={routePadrao} navigation={navigation} />
    );

    expect(
      await findByText('Não foi possível carregar as próximas partidas desta parada.')
    ).toBeTruthy();

    fireEvent.press(getByText('Tentar novamente'));

    expect(await findByText('0.111')).toBeTruthy();
    expect(getProximasPartidasParada).toHaveBeenCalledTimes(2);
  });

  it('recarrega a consulta ao tocar em Atualizar', async () => {
    getProximasPartidasParada.mockResolvedValue(RESPOSTA_PARTIDAS);

    const { findByText, getByText } = render(
      <ProximasPartidasScreen route={routePadrao} navigation={navigation} />
    );

    await findByText('0.111');
    fireEvent.press(getByText('Atualizar'));

    expect(await findByText('0.111')).toBeTruthy();
    expect(getProximasPartidasParada).toHaveBeenCalledTimes(2);
  });
});
