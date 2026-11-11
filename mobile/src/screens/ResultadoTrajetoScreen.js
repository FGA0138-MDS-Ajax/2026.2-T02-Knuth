import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function ResultadoTrajetoScreen({ route, navigation }) {
  const { opcoes } = route.params;

  const renderOpcao = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TrajetoDetalhe', { opcaoTrajeto: item })}
    >
      <View style={styles.headerCard}>
        <Text style={styles.tempoTotal}>{item.duracaoMinutos} min</Text>
        <Text style={styles.horario}>
          {item.partida} - {item.chegada}
        </Text>
      </View>
      
      <View style={styles.detalhes}>
        <Text style={styles.detalheTexto}>
          {item.baldeacoes === 0 ? 'Direto' : `${item.baldeacoes} baldeações`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Opções Encontradas</Text>
      <FlatList
        data={opcoes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderOpcao}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#006666', marginBottom: 16 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tempoTotal: { fontSize: 20, fontWeight: 'bold', color: '#006666' },
  horario: { fontSize: 14, color: '#666' },
  detalhes: { flexDirection: 'row' },
  detalheTexto: { fontSize: 14, color: '#333', fontWeight: '500' }
});