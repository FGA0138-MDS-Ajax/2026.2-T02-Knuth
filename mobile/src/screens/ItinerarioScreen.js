import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getItinerario } from '../services/api';

export default function ItinerarioScreen({ route }) {
  const { linhaId } = route.params;
  const [dados, setDados] = useState(null);
  const [sentido, setSentido] = useState('IDA');
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await getItinerario(linhaId);
        setDados(res);
      } catch (err) {
        console.error('Erro ao carregar itinerário:', err);
        setErro('Não foi possível carregar o itinerário.');
      }
    }
    carregar();
  }, [linhaId]);

  const paradas = dados?.itinerario?.[sentido] || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.numeroLinha}>{dados?.codigo || '---'}</Text>
        <Text style={styles.nomeLinha}>{dados?.nome || 'Carregando...'}</Text>
      </View>

      <View style={styles.tabContainer}>
        {['IDA', 'VOLTA'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.tab, sentido === s && styles.tabAtiva]}
            onPress={() => setSentido(s)}
          >
            <Text style={styles.tabTexto}>{s === 'IDA' ? 'Ida' : 'Volta'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {erro && <Text style={styles.erro}>{erro}</Text>}
      {!dados && !erro && <ActivityIndicator size="large" color="#006666" />}
      {dados && paradas.length === 0 && (
        <Text style={styles.vazio}>Nenhuma parada neste sentido.</Text>
      )}

      <FlatList
        data={paradas}
        keyExtractor={(item) => `${item.sequencia}-${item.paradaId}`}
        renderItem={({ item }) => (
          <View style={styles.paradaCard}>
            <View style={styles.seqBadge}>
              <Text style={styles.seqTexto}>{item.sequencia}</Text>
            </View>
            <View style={styles.paradaInfo}>
              <Text style={styles.paradaNome}>{item.nome}</Text>
              <Text style={styles.paradaCodigo}>Parada {item.codigo}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  header: { marginBottom: 16, alignItems: 'center' },
  numeroLinha: { fontSize: 24, fontWeight: 'bold', color: '#006666' },
  nomeLinha: { fontSize: 16, color: '#666' },
  tabContainer: { flexDirection: 'row', marginBottom: 16 },
  tab: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20, backgroundColor: '#E0E0E0', marginRight: 8 },
  tabAtiva: { backgroundColor: '#006666' },
  tabTexto: { color: '#FFF', fontWeight: 'bold' },
  erro: { color: '#B00020', marginVertical: 16 },
  vazio: { color: '#666', marginVertical: 16 },
  paradaCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  seqBadge: { backgroundColor: '#006666', borderRadius: 14, minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginRight: 12, paddingHorizontal: 6 },
  seqTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  paradaInfo: { flex: 1 },
  paradaNome: { fontSize: 15, fontWeight: '600', color: '#333' },
  paradaCodigo: { fontSize: 12, color: '#666' },
});