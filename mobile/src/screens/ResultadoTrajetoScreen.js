import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertaBadge } from '../components/AlertaBanner';

export default function ResultadoTrajetoScreen({ route, navigation }) {
  const { opcoes } = route.params;

  const renderOpcao = ({ item }) => {
    const temAlerta = Boolean(
      item.afetadaPorAlerta || (Array.isArray(item.alertas) && item.alertas.length > 0)
    );
    const resumoAlerta =
      Array.isArray(item.alertas) && item.alertas.length > 0
        ? item.alertas[0].titulo || item.alertas[0].descricao
        : null;

    return (
      <TouchableOpacity
        style={[styles.card, temAlerta && styles.cardComAlerta]}
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

        <AlertaBadge
          alertas={item.alertas}
          afetadaPorAlerta={item.afetadaPorAlerta}
          textoPadrao="Trajeto afetado por alerta"
        />
        {resumoAlerta ? (
          <Text style={styles.alertaResumo} numberOfLines={2}>
            {resumoAlerta}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

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
  cardComAlerta: { backgroundColor: '#FFFBEB', borderLeftWidth: 4, borderLeftColor: '#D97706' },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tempoTotal: { fontSize: 20, fontWeight: 'bold', color: '#006666' },
  horario: { fontSize: 14, color: '#666' },
  detalhes: { flexDirection: 'row' },
  detalheTexto: { fontSize: 14, color: '#333', fontWeight: '500' },
  alertaResumo: { fontSize: 12, color: '#92400E', marginTop: 6 }
});