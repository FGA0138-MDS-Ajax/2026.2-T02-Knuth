import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AlertasScreen from '../screens/AlertasScreen';
import { getAlertas } from '../services/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../services/api', () => ({
  getAlertas: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));


const criarAlerta = (extra = {}) => ({
  id: 1,
  tipo: 'DESVIO',
  descricao: 'Desvio na Av. W3 Sul por causa de obras.',
  data_inicio: '2026-11-20T08:30:00',
  data_fim: '2026-11-22T18:00:00',
  linhas_afetadas: [],
  paradas_afetadas: [],
  ...extra,
});

const renderTela = () => render(<AlertasScreen navigation={{ navigate: jest.fn() }} />);

// ---------- Testes ----------

describe('AlertasScreen', () => {
  let erroSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('carregamento', () => {
    it('mostra o indicador e a mensagem enquanto busca os alertas', () => {
      getAlertas.mockReturnValue(new Promise(() => {}));
      const { getByText, UNSAFE_getByType } = renderTela();

      expect(getByText('Consultando alertas vigentes...')).toBeTruthy();
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe('lista de alertas', () => {
    it('mostra tipo, descrição e período de vigência formatado', async () => {
      getAlertas.mockResolvedValue([criarAlerta()]);
      const { findByText, getByText } = renderTela();

      expect(await findByText('Desvio na Av. W3 Sul por causa de obras.')).toBeTruthy();
      expect(getByText('DESVIO')).toBeTruthy();
      expect(
        getByText(/Vigência: 20\/11\/2026 às 08:30 até 22\/11\/2026 às 18:00/)
      ).toBeTruthy();
    });

    it('mostra o rótulo correto para cada tipo de alerta', async () => {
      getAlertas.mockResolvedValue([
        criarAlerta({ id: 1, tipo: 'DESVIO', descricao: 'Alerta 1' }),
        criarAlerta({ id: 2, tipo: 'SUSPENSAO', descricao: 'Alerta 2' }),
        criarAlerta({ id: 3, tipo: 'PARALISACAO', descricao: 'Alerta 3' }),
        criarAlerta({ id: 4, tipo: 'ALTERACAO_HORARIO', descricao: 'Alerta 4' }),
      ]);
      const { findByText, getByText } = renderTela();

      await findByText('Alerta 1');
      expect(getByText('DESVIO')).toBeTruthy();
      expect(getByText('SUSPENSÃO')).toBeTruthy();
      expect(getByText('PARALISAÇÃO')).toBeTruthy();
      expect(getByText('ALTERAÇÃO DE HORÁRIO')).toBeTruthy();
    });

    it('usa o próprio tipo como rótulo quando o tipo é desconhecido', async () => {
      getAlertas.mockResolvedValue([
        criarAlerta({ tipo: 'MANUTENCAO', descricao: 'Manutenção na via' }),
      ]);
      const { findByText, getByText } = renderTela();

      await findByText('Manutenção na via');
      expect(getByText('MANUTENCAO')).toBeTruthy();
    });

    it('mostra o texto original quando a data é inválida e vazio quando é nula', async () => {
      getAlertas.mockResolvedValue([
        criarAlerta({ data_inicio: 'data-invalida', data_fim: null }),
      ]);
      const { findByText, getByText } = renderTela();

      await findByText('Desvio na Av. W3 Sul por causa de obras.');
      expect(getByText(/Vigência: data-invalida até/)).toBeTruthy();
    });

    it('mostra as linhas afetadas usando o código ou, na falta dele, o nome', async () => {
      getAlertas.mockResolvedValue([
        criarAlerta({
          linhas_afetadas: [{ codigo: '0.111' }, { nome: 'Linha Sem Código' }],
        }),
      ]);
      const { findByText, getByText } = renderTela();

      expect(await findByText('Linhas afetadas:')).toBeTruthy();
      expect(getByText('0.111')).toBeTruthy();
      expect(getByText('Linha Sem Código')).toBeTruthy();
    });

    it('mostra as paradas afetadas usando o nome ou, na falta dele, o código', async () => {
      getAlertas.mockResolvedValue([
        criarAlerta({
          paradas_afetadas: [{ nome: 'Rodoviária do Plano Piloto' }, { codigo: 'P-123' }],
        }),
      ]);
      const { findByText, getByText } = renderTela();

      expect(await findByText('Paradas afetadas:')).toBeTruthy();
      expect(getByText('Rodoviária do Plano Piloto')).toBeTruthy();
      expect(getByText('P-123')).toBeTruthy();
    });

    it('não mostra as seções de linhas e paradas quando não há itens afetados', async () => {
      getAlertas.mockResolvedValue([criarAlerta()]);
      const { findByText, queryByText } = renderTela();

      await findByText('Desvio na Av. W3 Sul por causa de obras.');
      expect(queryByText('Linhas afetadas:')).toBeNull();
      expect(queryByText('Paradas afetadas:')).toBeNull();
    });
  });

  describe('filtros por categoria', () => {
    const alertas = [
      criarAlerta({ id: 1, tipo: 'DESVIO', descricao: 'Texto do desvio' }),
      criarAlerta({ id: 2, tipo: 'SUSPENSAO', descricao: 'Texto da suspensão' }),
    ];

    it('filtra a lista ao tocar em uma categoria e volta a mostrar tudo em "Todos"', async () => {
      getAlertas.mockResolvedValue(alertas);
      const { findByText, getByText, queryByText } = renderTela();
      await findByText('Texto do desvio');

      fireEvent.press(getByText('Suspensões'));
      expect(queryByText('Texto do desvio')).toBeNull();
      expect(getByText('Texto da suspensão')).toBeTruthy();

      fireEvent.press(getByText('Desvios'));
      expect(getByText('Texto do desvio')).toBeTruthy();
      expect(queryByText('Texto da suspensão')).toBeNull();

      fireEvent.press(getByText('Todos'));
      expect(getByText('Texto do desvio')).toBeTruthy();
      expect(getByText('Texto da suspensão')).toBeTruthy();
    });

    it('mostra o estado vazio quando nenhum alerta pertence à categoria escolhida', async () => {
      getAlertas.mockResolvedValue([alertas[0]]);
      const { findByText, getByText, queryByText } = renderTela();
      await findByText('Texto do desvio');

      fireEvent.press(getByText('Paralisações'));

      expect(queryByText('Texto do desvio')).toBeNull();
      expect(getByText('Operação Normal')).toBeTruthy();
    });
  });

  describe('lista vazia', () => {
    it('mostra "Operação Normal" quando não há alertas', async () => {
      getAlertas.mockResolvedValue([]);
      const { findByText, getByText } = renderTela();

      expect(await findByText('Operação Normal')).toBeTruthy();
      expect(getByText(/Não há nenhum alerta ou imprevisto vigente/)).toBeTruthy();
    });

    it('trata uma resposta que não é lista como "sem alertas"', async () => {
      getAlertas.mockResolvedValue({ mensagem: 'sem alertas' });
      const { findByText } = renderTela();

      expect(await findByText('Operação Normal')).toBeTruthy();
    });

    it('"Atualizar agora" busca os alertas de novo', async () => {
      getAlertas
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([criarAlerta({ descricao: 'Alerta novo' })]);
      const { findByText, getByText } = renderTela();
      await findByText('Operação Normal');

      fireEvent.press(getByText('Atualizar agora'));

      expect(await findByText('Alerta novo')).toBeTruthy();
      expect(getAlertas).toHaveBeenCalledTimes(2);
    });
  });

  describe('erro ao carregar', () => {
    it('mostra a mensagem de erro e o botão de tentar novamente', async () => {
      getAlertas.mockRejectedValue(new Error('falha de rede'));
      const { findByText, getByText, queryByText } = renderTela();

      expect(
        await findByText('Não foi possível carregar os alertas vigentes no momento.')
      ).toBeTruthy();
      expect(getByText('Tentar novamente')).toBeTruthy();
      expect(queryByText('Operação Normal')).toBeNull();
      expect(erroSpy).toHaveBeenCalledWith('Erro ao buscar alertas:', expect.any(Error));
    });

    it('"Tentar novamente" recarrega e remove a mensagem de erro quando a API volta', async () => {
      getAlertas
        .mockRejectedValueOnce(new Error('falha de rede'))
        .mockResolvedValueOnce([criarAlerta({ descricao: 'Alerta recuperado' })]);
      const { findByText, getByText, queryByText } = renderTela();
      await findByText('Tentar novamente');

      fireEvent.press(getByText('Tentar novamente'));

      expect(await findByText('Alerta recuperado')).toBeTruthy();
      expect(
        queryByText('Não foi possível carregar os alertas vigentes no momento.')
      ).toBeNull();
    });
  });

  describe('usuário salvo no AsyncStorage', () => {
    it('lê o usuário salvo ao abrir a tela', async () => {
      getAlertas.mockResolvedValue([]);
      const { findByText } = renderTela();
      await findByText('Operação Normal');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@rotasdf_usuario');
    });

    it('não quebra a tela quando o usuário salvo é um JSON inválido', async () => {
      AsyncStorage.getItem.mockResolvedValue('{json inválido');
      getAlertas.mockResolvedValue([]);
      const { findByText } = renderTela();

      expect(await findByText('Operação Normal')).toBeTruthy();
      await waitFor(() => expect(erroSpy).toHaveBeenCalledWith(expect.any(Error)));
    });
  });
});