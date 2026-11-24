import React from 'react';
import { render } from '@testing-library/react-native';
import MapaTrajeto from '../components/MapaTrajeto';
import {
  construirDadosMapaItinerario,
  construirDadosMapaTrajeto,
  gerarHtmlMapaLeaflet,
} from '../utils/mapaHtml';

const TRAJETO_COM_BALDEACAO = {
  duracaoMinutos: 40,
  partida: '08:00',
  chegada: '08:40',
  mapa: {
    trechos: [
      {
        tipo: 'ONIBUS',
        linhaCodigo: '0.111',
        cor: '#006666',
        pontos: [
          { id: '1', nome: 'Rodoviária', latitude: -15.7938, longitude: -47.8827 },
          { id: '2', nome: 'W3 Sul 502', latitude: -15.805, longitude: -47.895 },
          { id: '3', nome: 'Praça Transferência', latitude: -15.815, longitude: -47.905 },
        ],
      },
      {
        tipo: 'CAMINHADA',
        titulo: 'Baldeação em Praça Transferência',
        pontos: [
          { id: '3', nome: 'Praça Transferência', latitude: -15.815, longitude: -47.905 },
          { id: '4', nome: 'Plataforma B', latitude: -15.816, longitude: -47.906 },
        ],
      },
      {
        tipo: 'ONIBUS',
        linhaCodigo: '0.222',
        cor: '#D97706',
        pontos: [
          { id: '4', nome: 'Plataforma B', latitude: -15.816, longitude: -47.906 },
          { id: '5', nome: 'UnB', latitude: -15.763, longitude: -47.871 },
        ],
      },
    ],
    marcadores: [
      { tipo: 'EMBARQUE', titulo: 'Embarque', nome: 'Rodoviária', linhaCodigo: '0.111', latitude: -15.7938, longitude: -47.8827 },
      { tipo: 'BALDEACAO', titulo: 'Baldeação', nome: 'Praça Transferência', linhaCodigo: '0.111 → 0.222', latitude: -15.815, longitude: -47.905 },
      { tipo: 'DESEMBARQUE', titulo: 'Desembarque', nome: 'UnB', linhaCodigo: '0.222', latitude: -15.763, longitude: -47.871 },
    ],
  },
};

describe('MapaTrajeto e mapaHtml (RF04 / RF08)', () => {
  describe('construirDadosMapaTrajeto', () => {
    it('normaliza trechos de ônibus, caminhada e marcadores de embarque, baldeação e desembarque', () => {
      const dados = construirDadosMapaTrajeto(TRAJETO_COM_BALDEACAO);

      expect(dados.trechos).toHaveLength(3);
      expect(dados.trechos[0]).toMatchObject({ tipo: 'ONIBUS', linhaCodigo: '0.111', cor: '#006666' });
      expect(dados.trechos[1]).toMatchObject({ tipo: 'CAMINHADA', cor: '#475569' });
      expect(dados.trechos[2]).toMatchObject({ tipo: 'ONIBUS', linhaCodigo: '0.222', cor: '#D97706' });
      expect(dados.marcadores.map((m) => m.tipo)).toEqual(['EMBARQUE', 'BALDEACAO', 'DESEMBARQUE']);
    });

    it('reconstrói dados do mapa a partir de etapas quando a propriedade mapa não vem preenchida', () => {
      const dados = construirDadosMapaTrajeto({
        etapas: [
          {
            ordem: 1,
            tipo: 'ONIBUS',
            linhaCodigo: '0.116',
            paradas: [
              { nome: 'Origem', latitude: -15.79, longitude: -47.88 },
              { nome: 'Destino', latitude: -15.76, longitude: -47.87 },
            ],
          },
        ],
      });

      expect(dados.trechos).toHaveLength(1);
      expect(dados.marcadores).toHaveLength(2);
      expect(dados.marcadores[0]).toMatchObject({ tipo: 'EMBARQUE', nome: 'Origem' });
      expect(dados.marcadores[1]).toMatchObject({ tipo: 'DESEMBARQUE', nome: 'Destino' });
    });

    it('retorna listas vazias quando não há coordenadas válidas', () => {
      expect(construirDadosMapaTrajeto({ etapas: [] })).toEqual({ trechos: [], marcadores: [] });
    });
  });

  describe('construirDadosMapaItinerario (RF08)', () => {
    it('gera trecho único e marcadores de início e fim a partir das paradas do itinerário', () => {
      const dados = construirDadosMapaItinerario(
        [
          { paradaId: 1, nome: 'Terminal', latitude: -15.79, longitude: -47.88 },
          { paradaId: 2, nome: 'Meio', latitude: -15.80, longitude: -47.89 },
          { paradaId: 3, nome: 'Final', latitude: -15.81, longitude: -47.90 },
        ],
        '0.111',
        '#1565C0'
      );

      expect(dados.trechos).toHaveLength(1);
      expect(dados.trechos[0].pontos).toHaveLength(3);
      expect(dados.trechos[0].cor).toBe('#1565C0');
      expect(dados.marcadores.map((m) => m.titulo)).toEqual([
        'Início do itinerário',
        'Final do itinerário',
      ]);
    });
  });

  describe('gerarHtmlMapaLeaflet', () => {
    it('gera HTML Leaflet diferenciando linha tracejada para caminhada e marcadores coloridos', () => {
      const html = gerarHtmlMapaLeaflet(construirDadosMapaTrajeto(TRAJETO_COM_BALDEACAO));

      expect(html).toContain('leaflet');
      expect(html).toContain("dashArray: isCaminhada ? '8, 8' : null");
      expect(html).toContain('EMBARQUE');
      expect(html).toContain('BALDEACAO');
      expect(html).toContain('DESEMBARQUE');
      expect(html).toContain('0.111');
      expect(html).toContain('0.222');
    });
  });

  describe('componente MapaTrajeto', () => {
    it('renderiza o WebView, a legenda de linhas/caminhada e os marcadores do percurso', () => {
      const dados = construirDadosMapaTrajeto(TRAJETO_COM_BALDEACAO);
      const { getByTestId, getByText } = render(
        <MapaTrajeto trechos={dados.trechos} marcadores={dados.marcadores} />
      );

      expect(getByTestId('mapa-webview')).toBeTruthy();
      expect(getByText('Legenda do percurso')).toBeTruthy();
      expect(getByText('Linha 0.111')).toBeTruthy();
      expect(getByText('Linha 0.222')).toBeTruthy();
      expect(getByText('Trecho a pé / baldeação')).toBeTruthy();
      expect(getByText('Embarque')).toBeTruthy();
      expect(getByText('Baldeação')).toBeTruthy();
      expect(getByText('Desembarque')).toBeTruthy();
      expect(getByText('Rodoviária')).toBeTruthy();
      expect(getByText('Praça Transferência')).toBeTruthy();
      expect(getByText('UnB')).toBeTruthy();
    });

    it('exibe mensagem informativa quando não há coordenadas válidas', () => {
      const { getByText, queryByTestId } = render(
        <MapaTrajeto
          trechos={[]}
          marcadores={[]}
          mensagemVazio="Sem coordenadas para este trajeto."
        />
      );

      expect(queryByTestId('mapa-webview')).toBeNull();
      expect(getByText('Sem coordenadas para este trajeto.')).toBeTruthy();
    });
  });
});
