import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function TrajetoDetalheScreen({ route }) {
  const { opcaoTrajeto } = route.params;

  const renderEtapa = ({ item, index }) => {
    const isUltima = index === opcaoTrajeto.etapas.length - 1;
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
          <Text style={styles.etapaDuracao}>{item.duracaoMinutos} min</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.tempoTotal}>{opcaoTrajeto.duracaoMinutos} min</Text>
        <Text style={styles.detalheTexto}>
          Partida: {opcaoTrajeto.partida} | Chegada: {opcaoTrajeto.chegada}
        </Text>
      </View>

      <Text style={styles.tituloPassoAPasso}>Passo a passo:</Text>

      <FlatList
        data={opcaoTrajeto.etapas}
        keyExtractor={(item) => item.ordem.toString()}
        renderItem={renderEtapa}
        contentContainerStyle={styles.listaContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  headerCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 24, alignItems: 'center', elevation: 2 },
  tempoTotal: { fontSize: 24, fontWeight: 'bold', color: '#006666', marginBottom: 4 },
  detalheTexto: { fontSize: 14, color: '#666' },
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