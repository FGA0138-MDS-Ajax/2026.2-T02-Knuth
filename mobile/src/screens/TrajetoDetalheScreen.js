import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AlertaBanner from '../components/AlertaBanner';
import MapaTrajeto from '../components/MapaTrajeto';
import { formatarDuracao } from '../utils/formatarDuracao';
import { construirDadosMapaTrajeto } from '../utils/mapaHtml';

export default function TrajetoDetalheScreen({ route, navigation }) {
  const { opcaoTrajeto } = route.params;
  const [modoVisualizacao, setModoVisualizacao] = useState('ETAPAS');

  const etapas = Array.isArray(opcaoTrajeto?.etapas) ? opcaoTrajeto.etapas : [];
  const dadosMapa = useMemo(
    () => construirDadosMapaTrajeto(opcaoTrajeto),
    [opcaoTrajeto]
  );

  const renderEtapa = ({ item, index }) => {
    const isUltima = index === etapas.length - 1;
    const isOnibus = item.tipo === 'ONIBUS';

    return (
      <View style={styles.etapaContainer}>
        <View style={styles.linhaTempoContainer}>
          <View style={[styles.bolinha, isOnibus ? styles.bolinhaOnibus : styles.bolinhaCaminhada]}>
            <Text style={styles.bolinhaTexto}>{isOnibus ? '🚌' : '🚶'}</Text>
          </View>
          {!isUltima && <View style={styles.linhaVertical} />}
        </View>

        <View style={styles.etapaInfo}>
          <Text style={styles.etapaInstrucao}>{item.instrucao}</Text>
          <Text style={styles.etapaDuracao}>{formatarDuracao(item.duracaoMinutos)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.tempoTotal}>{formatarDuracao(opcaoTrajeto.duracaoMinutos)}</Text>
        <Text style={styles.detalheTexto}>
          Partida: {opcaoTrajeto.partida} | Chegada: {opcaoTrajeto.chegada}
        </Text>
      </View>

      <AlertaBanner
        alertas={opcaoTrajeto.alertas}
        afetadaPorAlerta={Boolean(opcaoTrajeto.afetadaPorAlerta)}
        onPress={navigation ? () => navigation.navigate('Alertas') : undefined}
      />

      <View style={styles.modoContainer}>
        <TouchableOpacity
          style={[styles.modoBotao, modoVisualizacao === 'ETAPAS' && styles.modoBotaoAtivo]}
          onPress={() => setModoVisualizacao('ETAPAS')}
        >
          <Text style={[styles.modoTexto, modoVisualizacao === 'ETAPAS' && styles.modoTextoAtivo]}>
            Etapas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modoBotao, modoVisualizacao === 'MAPA' && styles.modoBotaoAtivo]}
          onPress={() => setModoVisualizacao('MAPA')}
        >
          <Text style={[styles.modoTexto, modoVisualizacao === 'MAPA' && styles.modoTextoAtivo]}>
            Ver no mapa
          </Text>
        </TouchableOpacity>
      </View>

      {modoVisualizacao === 'MAPA' ? (
        <View style={{ flex: 1 }}>
          <MapaTrajeto
            trechos={dadosMapa.trechos}
            marcadores={dadosMapa.marcadores}
            mensagemVazio="Coordenadas indisponíveis para exibir este trajeto no mapa."
          />
        </View>
      ) : (
        <>
          <Text style={styles.tituloPassoAPasso}>Passo a passo:</Text>

          <FlatList
            data={etapas}
            keyExtractor={(item) => item.ordem.toString()}
            renderItem={renderEtapa}
            contentContainerStyle={styles.listaContent}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  headerCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 16, alignItems: 'center', elevation: 2 },
  tempoTotal: { fontSize: 24, fontWeight: 'bold', color: '#006666', marginBottom: 4 },
  detalheTexto: { fontSize: 14, color: '#666' },
  modoContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 4, marginBottom: 16 },
  modoBotao: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  modoBotaoAtivo: { backgroundColor: '#006666' },
  modoTexto: { fontSize: 14, fontWeight: 'bold', color: '#475569' },
  modoTextoAtivo: { color: '#FFF' },
  tituloPassoAPasso: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  listaContent: { paddingBottom: 20 },
  etapaContainer: { flexDirection: 'row', marginBottom: 16 },
  linhaTempoContainer: { alignItems: 'center', width: 40, marginRight: 12 },
  bolinha: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  bolinhaOnibus: { backgroundColor: '#006666' },
  bolinhaCaminhada: { backgroundColor: '#888' },
  bolinhaTexto: { fontSize: 16 },
  linhaVertical: { width: 2, flex: 1, backgroundColor: '#CCC', marginTop: 4, marginBottom: -20 },
  etapaInfo: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 8, elevation: 1 },
  etapaInstrucao: { fontSize: 15, color: '#333', fontWeight: '500', marginBottom: 4 },
  etapaDuracao: { fontSize: 13, color: '#666' }
});
