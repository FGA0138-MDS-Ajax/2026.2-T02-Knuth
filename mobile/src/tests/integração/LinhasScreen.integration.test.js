
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LinhasScreen from '../../screens/LinhasScreen';
import { getLinhas } from '../../services/api';

// Mocks das dependências externas
jest.mock('../../services/api');

jest.mock('../../utils/buscasRecentesStorage', () => ({
  listarLinhasRecentes: jest.fn().mockResolvedValue([]),
  salvarLinhaRecenteLocal: jest.fn().mockResolvedValue([]),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('Integração: Tela de Linhas Mobile', () => {
  const mockNavigate = jest.fn();

  const mockNavigation = {
    navigate: mockNavigate,
    setOptions: jest.fn(),
    addListener: jest.fn().mockReturnValue(() => {}),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Simula o retorno da API com duas linhas fictícias
    getLinhas.mockResolvedValue([
      {
        id: '1',
        codigo: '0.600',
        nome: 'Planaltina',
        cor: '#FFF',
        afetadaPorAlerta: false,
        alertas: [],
      },
      {
        id: '2',
        codigo: '0.110',
        nome: 'UnB',
        cor: '#FFF',
        afetadaPorAlerta: false,
        alertas: [],
      },
    ]);
  });

  it('Deve buscar os dados na API e renderizar a lista de linhas na tela', async () => {
    render(<LinhasScreen navigation={mockNavigation} />);

    expect(screen.getByText('Carregando linhas...')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('0.600')).toBeTruthy();
      expect(screen.getByText('Planaltina')).toBeTruthy();
      expect(screen.getByText('0.110')).toBeTruthy();
      expect(screen.getByText('UnB')).toBeTruthy();
    });
  });

  it('Deve filtrar a lista em tempo real quando o usuário digita na barra de busca', async () => {
    render(<LinhasScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('0.600')).toBeTruthy();
    });

    const inputBusca = screen.getByPlaceholderText(
      'Pesquisar por número ou nome...'
    );

    fireEvent.changeText(inputBusca, '0.110');

    expect(screen.queryByText('0.600')).toBeNull();
    expect(screen.getByText('0.110')).toBeTruthy();
  });

  it('Deve exibir a mensagem de vazio quando a busca não encontrar nenhuma linha', async () => {
    render(<LinhasScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('0.600')).toBeTruthy();
    });

    const inputBusca = screen.getByPlaceholderText(
      'Pesquisar por número ou nome...'
    );

    fireEvent.changeText(inputBusca, 'Linha Fantasma');

    expect(
      screen.getByText('Nenhuma linha encontrada para "Linha Fantasma"')
    ).toBeTruthy();
  });

  it('Deve navegar para a tela de Horários ao clicar no card de uma linha', async () => {
    render(<LinhasScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('0.600')).toBeTruthy();
    });

    const linhaCard = screen.getByText('0.600');

    fireEvent.press(linhaCard);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Horarios', {
        linhaId: '1',
      });
    });
  });
});
