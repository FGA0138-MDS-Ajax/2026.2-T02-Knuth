import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertaBadge } from '../components/AlertaBanner';
import FavoritoEstrela from '../components/FavoritoEstrela';
import { formatarDuracao } from '../utils/formatarDuracao';
import { formatarResumoPlanejamento } from '../utils/planejamentoHorario';

export default function ResultadoTrajetoScreen({ route, navigation }) {
  const { opcoes, origem, destino, planejamentoHorario } = route.params;
  const resumoHorario = formatarResumoPlanejamento(planejamentoHorario);

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
          <Text style={styles.tempoTotal}>{formatarDuracao(item.duracaoMinutos)}</Text>
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
      {origem && destino ? (
        <View style={styles.resumoTrajeto}>
          <Text style={styles.resumoTrajetoTexto} numberOfLines={2}>
            {origem} → {destino}
          </Text>
          <FavoritoEstrela item={{ tipo: 'TRAJETO', origem, destino }} />
        </View>
      ) : null}
      {resumoHorario ? (
        <View style={styles.planejamentoBadge}>
          <Text style={styles.planejamentoBadgeTexto}>Planejamento: {resumoHorario}</Text>
        </View>
      ) : null}
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
  resumoTrajeto: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF7E6', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F3D9A4', marginBottom: 14 },
  resumoTrajetoTexto: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', marginRight: 10 },
  planejamentoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2F1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  planejamentoBadgeTexto: { fontSize: 13, fontWeight: '600', color: '#006666' },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  cardComAlerta: { backgroundColor: '#FFFBEB', borderLeftWidth: 4, borderLeftColor: '#D97706' },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tempoTotal: { fontSize: 20, fontWeight: 'bold', color: '#006666' },
  horario: { fontSize: 14, color: '#666' },
  detalhes: { flexDirection: 'row' },
  detalheTexto: { fontSize: 14, color: '#333', fontWeight: '500' },
  alertaResumo: { fontSize: 12, color: '#92400E', marginTop: 6 }
});