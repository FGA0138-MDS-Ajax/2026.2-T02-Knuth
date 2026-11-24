import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { gerarHtmlMapaLeaflet } from '../utils/mapaHtml';

const COR_MARCADOR = {
  EMBARQUE: '#16A34A',
  BALDEACAO: '#EA580C',
  DESEMBARQUE: '#DC2626',
};

const LETRA_MARCADOR = {
  EMBARQUE: 'E',
  BALDEACAO: 'B',
  DESEMBARQUE: 'D',
};

// RF04 / RF08 - Renderiza mapa interativo (Leaflet/OpenStreetMap) com trechos e marcadores
export default function MapaTrajeto({
  trechos = [],
  marcadores = [],
  altura = 360,
  mensagemVazio = 'Coordenadas indisponíveis para exibir o mapa deste percurso.',
}) {
  const temPontos = useMemo(() => {
    const emTrechos = trechos.some((t) => Array.isArray(t.pontos) && t.pontos.length >= 2);
    return emTrechos || marcadores.length > 0;
  }, [trechos, marcadores]);

  const html = useMemo(() => {
    if (!temPontos) return '';
    return gerarHtmlMapaLeaflet({ trechos, marcadores });
  }, [temPontos, trechos, marcadores]);

  if (!temPontos) {
    return (
      <View style={styles.vazioBox}>
        <Text style={styles.vazioTexto}>{mensagemVazio}</Text>
      </View>
    );
  }

  const trechosOnibus = trechos.filter((t) => t.tipo === 'ONIBUS');
  const temCaminhada = trechos.some((t) => t.tipo === 'CAMINHADA');

  return (
    <View style={styles.container}>
      <View style={[styles.mapaWrapper, { height: altura }]}>
        {Platform.OS === 'web' ? (
          <iframe
            title="Mapa do percurso"
            srcDoc={html}
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <WebView
            testID="mapa-webview"
            originWhitelist={['*']}
            source={{ html }}
            javaScriptEnabled
            domStorageEnabled
            style={styles.webview}
          />
        )}
      </View>

      <View style={styles.legendaCard}>
        <Text style={styles.legendaTitulo}>Legenda do percurso</Text>
        <View style={styles.legendaItens}>
          {trechosOnibus.map((trecho, idx) => (
            <View key={`onibus-${trecho.linhaCodigo || idx}-${idx}`} style={styles.legendaItem}>
              <View style={[styles.linhaSolida, { backgroundColor: trecho.cor || '#006666' }]} />
              <Text style={styles.legendaTexto}>
                {trecho.linhaCodigo ? `Linha ${trecho.linhaCodigo}` : trecho.titulo || 'Ônibus'}
              </Text>
            </View>
          ))}
          {temCaminhada ? (
            <View style={styles.legendaItem}>
              <View style={styles.linhaTracejada} />
              <Text style={styles.legendaTexto}>Trecho a pé / baldeação</Text>
            </View>
          ) : null}
        </View>

        {marcadores.length > 0 ? (
          <View style={styles.marcadoresLista}>
            {marcadores.map((marcador, idx) => {
              const cor = COR_MARCADOR[marcador.tipo] || '#006666';
              const letra = LETRA_MARCADOR[marcador.tipo] || 'P';
              return (
                <View key={`${marcador.tipo}-${idx}`} style={styles.marcadorLinha}>
                  <View style={[styles.marcadorBadge, { backgroundColor: cor }]}>
                    <Text style={styles.marcadorBadgeTexto}>{letra}</Text>
                  </View>
                  <View style={styles.marcadorInfo}>
                    <Text style={styles.marcadorTitulo}>{marcador.titulo}</Text>
                    <Text style={styles.marcadorNome} numberOfLines={2}>
                      {marcador.nome}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapaWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
  vazioBox: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vazioTexto: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  legendaCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    elevation: 1,
    marginBottom: 16,
  },
  legendaTitulo: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  legendaItens: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  legendaItem: { flexDirection: 'row', alignItems: 'center' },
  linhaSolida: { width: 20, height: 4, borderRadius: 2, marginRight: 6 },
  linhaTracejada: {
    width: 20,
    height: 0,
    borderTopWidth: 3,
    borderColor: '#475569',
    borderStyle: 'dashed',
    marginRight: 6,
  },
  legendaTexto: { fontSize: 12, color: '#334155', fontWeight: '600' },
  marcadoresLista: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    gap: 8,
  },
  marcadorLinha: { flexDirection: 'row', alignItems: 'center' },
  marcadorBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  marcadorBadgeTexto: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  marcadorInfo: { flex: 1 },
  marcadorTitulo: { fontSize: 12, fontWeight: 'bold', color: '#0F172A' },
  marcadorNome: { fontSize: 12, color: '#475569' },
});
