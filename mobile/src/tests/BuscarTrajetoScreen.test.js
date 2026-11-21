import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';

import BuscarTrajetoScreen from '../screens/BuscarTrajetoScreen';
import {
  getTrajetos,
  getParadaProxima,
  buscarParadas,
  getBuscasRecentes,
  salvarBuscaRecente,
} from '../services/api';
import {
  listarTrajetosRecentes,
  salvarTrajetoRecenteLocal,
  obterUsuarioLogadoId,
} from '../utils/buscasRecentesStorage';


jest.mock('expo-location', () => ({
  __esModule: true,
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}));

jest.mock('../services/api', () => ({
  getTrajetos: jest.fn(),
  getParadaProxima: jest.fn(),
  buscarParadas: jest.fn(),
  getBuscasRecentes: jest.fn(),
  salvarBuscaRecente: jest.fn(),
}));

jest.mock('../utils/buscasRecentesStorage', () => ({
  listarTrajetosRecentes: jest.fn(),
  salvarTrajetoRecenteLocal: jest.fn(),
  mesclarTrajetosRecentes: jest.fn((locais, remotos) => [...locais, ...remotos]),
  obterUsuarioLogadoId: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
});

const PLACEHOLDER_DESTINO = 'Ex: Rodoviária do Plano Piloto';
const PARADA = { nome: 'Asa Sul - Quadra 704' };
const POSICAO = { coords: { latitude: -15.79, longitude: -47.88 } };

function mockGpsOk(parada = PARADA) {
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Location.getCurrentPositionAsync.mockResolvedValue(POSICAO);
  getParadaProxima.mockResolvedValue(parada);
}

// ---------- Testes ----------

describe('BuscarTrajetoScreen', () => {
  const navigation = { navigate: jest.fn() };
  let erroSpy;

  const renderTela = () => render(<BuscarTrajetoScreen navigation={navigation} />);

  const renderComOrigem = async () => {
    mockGpsOk();
    const tela = renderTela();
    await tela.findByText(PARADA.nome);
    return tela;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    listarTrajetosRecentes.mockResolvedValue([]);
    salvarTrajetoRecenteLocal.mockResolvedValue([]);
    obterUsuarioLogadoId.mockResolvedValue(null);
    getBuscasRecentes.mockResolvedValue([]);
    salvarBuscaRecente.mockResolvedValue({});
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('localização (origem)', () => {
    it('mostra o estado de busca enquanto o GPS ainda não respondeu', () => {
      Location.requestForegroundPermissionsAsync.mockReturnValue(new Promise(() => {}));
      const { getByText, queryByText } = renderTela();

      expect(getByText('Buscando sua localização exata...')).toBeTruthy();
      expect(queryByText('Localização não encontrada')).toBeNull();
    });

    it('preenche a origem com a parada mais próxima da posição atual', async () => {
      mockGpsOk();
      const { findByText, queryByText } = renderTela();

      expect(await findByText(PARADA.nome)).toBeTruthy();
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.High,
      });
      expect(getParadaProxima).toHaveBeenCalledWith(-15.79, -47.88);
      expect(queryByText('Buscando sua localização exata...')).toBeNull();
    });

    it('mostra erro e não consulta o GPS quando a permissão é negada', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
      const { findByText, getByText } = renderTela();

      expect(
        await findByText('Permissão negada. Ative o GPS para usar o planejador.')
      ).toBeTruthy();
      expect(getByText('Localização não encontrada')).toBeTruthy();
      expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
      expect(getParadaProxima).not.toHaveBeenCalled();
    });

    it.each([
      ['resposta nula', null],
      ['parada sem nome', { id: 1 }],
    ])('mostra erro quando a API devolve %s', async (_descricao, resposta) => {
      mockGpsOk(resposta);
      const { findByText, getByText } = renderTela();

      expect(
        await findByText('Nenhuma parada encontrada próxima à sua localização.')
      ).toBeTruthy();
      expect(getByText('Localização não encontrada')).toBeTruthy();
    });

    it('mostra erro quando o GPS falha', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.getCurrentPositionAsync.mockRejectedValue(new Error('gps desligado'));
      const { findByText, getByText } = renderTela();

      expect(
        await findByText('Erro ao obter o GPS. Verifique se a localização está ligada.')
      ).toBeTruthy();
      expect(getByText('Localização não encontrada')).toBeTruthy();
      expect(erroSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    it('"Atualizar Localização" busca a posição de novo e troca a origem', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.getCurrentPositionAsync.mockResolvedValue(POSICAO);
      getParadaProxima
        .mockResolvedValueOnce({ nome: 'Parada A' })
        .mockResolvedValueOnce({ nome: 'Parada B' });
      const { findByText, getByText } = renderTela();
      await findByText('Parada A');

      fireEvent.press(getByText('Atualizar Localização'));

      expect(await findByText('Parada B')).toBeTruthy();
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(2);
    });

    it('"Atualizar Localização" não faz nada enquanto o GPS ainda está buscando', () => {
      Location.requestForegroundPermissionsAsync.mockReturnValue(new Promise(() => {}));
      const { getByText } = renderTela();

      fireEvent.press(getByText('Atualizar Localização'));

      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('sinaliza alerta quando a parada mais próxima possui alertas vigentes (RF14)', async () => {
      mockGpsOk({
        id: '3368',
        nome: 'Asa Sul - Quadra 704',
        afetadaPorAlerta: true,
        alertas: [{ id: 5, tipo: 'SUSPENSAO', descricao: 'Parada interditada temporariamente.' }],
      });
      const { findByText, getByText } = renderTela();

      expect(await findByText('⚠ Alerta na parada de origem')).toBeTruthy();
      expect(getByText('Parada interditada temporariamente.')).toBeTruthy();

      fireEvent.press(getByText('Ver detalhes ›'));
      expect(navigation.navigate).toHaveBeenCalledWith('Alertas');
    });
  });

  describe('busca de trajetos', () => {
    it('não permite buscar enquanto não há origem', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
      const { findByText, getByText, getByPlaceholderText } = renderTela();
      await findByText('Permissão negada. Ative o GPS para usar o planejador.');

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_DESTINO), 'Rodoviária');
      fireEvent.press(getByText('Buscar Trajetos'));

      expect(getTrajetos).not.toHaveBeenCalled();
      expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('pede o destino quando o campo está vazio', async () => {
      const { getByText } = await renderComOrigem();

      fireEvent.press(getByText('Buscar Trajetos'));

      expect(getByText('Por favor, preencha o destino.')).toBeTruthy();
      expect(getTrajetos).not.toHaveBeenCalled();
    });

    it('pede o destino quando o campo tem só espaços', async () => {
      const { getByText, getByPlaceholderText } = await renderComOrigem();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_DESTINO), '   ');
      fireEvent.press(getByText('Buscar Trajetos'));

      expect(getByText('Por favor, preencha o destino.')).toBeTruthy();
      expect(getTrajetos).not.toHaveBeenCalled();
    });

    it('busca com origem e destino e navega para ResultadoTrajeto', async () => {
      const opcoes = [{ id: 1 }, { id: 2 }];
      getTrajetos.mockResolvedValue(opcoes);
      const { getByText, getByPlaceholderText } = await renderComOrigem();

      fireEvent.changeText(
        getByPlaceholderText(PLACEHOLDER_DESTINO),
        'Rodoviária do Plano Piloto'
      );
      fireEvent.press(getByText('Buscar Trajetos'));

      await waitFor(() =>
        expect(navigation.navigate).toHaveBeenCalledWith('ResultadoTrajeto', {
          opcoes,
          origem: PARADA.nome,
          destino: 'Rodoviária do Plano Piloto',
        })
      );
      expect(getTrajetos).toHaveBeenCalledWith(PARADA.nome, 'Rodoviária do Plano Piloto');
    });

    it('troca o texto do botão por um indicador enquanto busca', async () => {
      getTrajetos.mockReturnValue(new Promise(() => {}));
      const { getByText, queryByText, getByPlaceholderText, UNSAFE_getByType } =
        await renderComOrigem();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_DESTINO), 'Rodoviária');
      fireEvent.press(getByText('Buscar Trajetos'));

      expect(queryByText('Buscar Trajetos')).toBeNull();
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it.each([
      ['lista vazia', []],
      ['resposta nula', null],
    ])('mostra erro e não navega quando a API devolve %s', async (_descricao, resposta) => {
      getTrajetos.mockResolvedValue(resposta);
      const { getByText, findByText, getByPlaceholderText } = await renderComOrigem();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_DESTINO), 'Lugar Nenhum');
      fireEvent.press(getByText('Buscar Trajetos'));

      expect(await findByText('Nenhuma rota encontrada para esses locais.')).toBeTruthy();
      expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('mostra erro de conexão quando a API falha', async () => {
      getTrajetos.mockRejectedValue(new Error('falha de rede'));
      const { getByText, findByText, getByPlaceholderText } = await renderComOrigem();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_DESTINO), 'Rodoviária');
      fireEvent.press(getByText('Buscar Trajetos'));

      expect(await findByText('Erro ao conectar com o servidor.')).toBeTruthy();
      expect(navigation.navigate).not.toHaveBeenCalled();
      expect(erroSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    it('limpa a mensagem de erro anterior ao buscar de novo', async () => {
      const opcoes = [{ id: 1 }];
      getTrajetos.mockResolvedValue(opcoes);
      const { getByText, queryByText, getByPlaceholderText } = await renderComOrigem();

      fireEvent.press(getByText('Buscar Trajetos'));
      expect(getByText('Por favor, preencha o destino.')).toBeTruthy();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_DESTINO), 'Rodoviária');
      fireEvent.press(getByText('Buscar Trajetos'));

      await waitFor(() =>
        expect(navigation.navigate).toHaveBeenCalledWith('ResultadoTrajeto', {
          opcoes,
          origem: PARADA.nome,
          destino: 'Rodoviária',
        })
      );
      expect(queryByText('Por favor, preencha o destino.')).toBeNull();
    });

    it('aceita origem e destino pré-preenchidos por rota (favoritos RF17) sem sobrescrever com GPS', () => {
      const { getByText, getByDisplayValue } = render(
        <BuscarTrajetoScreen
          route={{ params: { origem: 'Asa Sul', destino: 'Rodoviária' } }}
          navigation={navigation}
        />
      );

      expect(getByText('Asa Sul')).toBeTruthy();
      expect(getByDisplayValue('Rodoviária')).toBeTruthy();
      expect(getByText('Salvar este trajeto nos favoritos')).toBeTruthy();
      expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('permite editar a origem manualmente e selecionar sugestão de destino do autocomplete', async () => {
      buscarParadas.mockResolvedValue([
        { id: '3369', nome: 'PLATAFORMA SUPERIOR DA RODOVIARIA - APOS ROD.PP EIXO L SUL' },
      ]);
      const { getByText, getByPlaceholderText, findByText, getByDisplayValue } =
        await renderComOrigem();

      fireEvent.press(getByText('Digitar outra origem'));
      fireEvent.changeText(getByPlaceholderText('Ex: UnB, Taguatinga, W3 Norte...'), 'UnB');
      fireEvent.press(getByText('Confirmar origem'));
      expect(getByText('UnB')).toBeTruthy();

      fireEvent.changeText(getByPlaceholderText(PLACEHOLDER_DESTINO), 'Rodoviária');
      const sugestao = await findByText(
        'PLATAFORMA SUPERIOR DA RODOVIARIA - APOS ROD.PP EIXO L SUL'
      );
      fireEvent.press(sugestao);

      expect(
        getByDisplayValue('PLATAFORMA SUPERIOR DA RODOVIARIA - APOS ROD.PP EIXO L SUL')
      ).toBeTruthy();
    });

    it('exibe buscas recentes e repete a consulta ao tocar em um item (RF18)', async () => {
      const opcoes = [{ duracaoMinutos: 20, partida: '08:00', chegada: '08:20', baldeacoes: 0 }];
      listarTrajetosRecentes.mockResolvedValue([
        { origem: 'UnB', destino: 'Rodoviária do Plano Piloto' },
      ]);
      getTrajetos.mockResolvedValue(opcoes);
      mockGpsOk();
      const { findByText } = renderTela();

      expect(await findByText('Buscas recentes')).toBeTruthy();
      const itemRecente = await findByText('UnB → Rodoviária do Plano Piloto');
      fireEvent.press(itemRecente);

      await waitFor(() =>
        expect(getTrajetos).toHaveBeenCalledWith('UnB', 'Rodoviária do Plano Piloto')
      );
      expect(navigation.navigate).toHaveBeenCalledWith('ResultadoTrajeto', {
        opcoes,
        origem: 'UnB',
        destino: 'Rodoviária do Plano Piloto',
      });
    });
  });
});