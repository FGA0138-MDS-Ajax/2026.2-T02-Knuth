import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getItinerario } from '../services/api';
import AlertaBanner, { AlertaBadge } from '../components/AlertaBanner';
import FavoritoEstrela from '../components/FavoritoEstrela';
import FavoritosCarregador from '../components/FavoritosCarregador';

export default function ItinerarioScreen({ route, navigation }) {
  const { linhaId } = route.params;
  const [dados, setDados] = useState(null);
  const [sentido, setSentido] = useState('IDA');
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await getItinerario(linhaId);
        setDados(res);
        const temIdaRes = Array.isArray(res?.itinerario?.IDA) && res.itinerario.IDA.length > 0;
        const temVoltaRes = Array.isArray(res?.itinerario?.VOLTA) && res.itinerario.VOLTA.length > 0;
        setSentido(!temIdaRes && temVoltaRes ? 'VOLTA' : 'IDA');
      } catch (err) {
        console.error('Erro ao carregar itinerário:', err);
        setErro('Não foi possível carregar o itinerário.');
      }
    }
    carregar();
  }, [linhaId]);

  const temIda = Array.isArray(dados?.itinerario?.IDA) && dados.itinerario.IDA.length > 0;
  const temVolta = Array.isArray(dados?.itinerario?.VOLTA) && dados.itinerario.VOLTA.length > 0;
  const sentidoUnico = (temIda && !temVolta) || (!temIda && temVolta);
  const ehCircular = /circular/i.test(dados?.nome || '');
  const rotuloSentidoUnico = temIda
    ? ehCircular
      ? 'Circular (sentido único)'
      : 'Sentido único (Ida)'
    : 'Sentido único (Volta)';

  const paradas = dados?.itinerario?.[sentido] || [];
  const linhaRef = dados?.codigo || String(linhaId);

  return (
    <View style={styles.container}>
      <FavoritosCarregador navigation={navigation} />
      <View style={styles.header}>
        <Text style={styles.numeroLinha}>{dados?.codigo || '---'}</Text>
        <Text style={styles.nomeLinha}>{dados?.nome || 'Carregando...'}</Text>
      </View>

      <AlertaBanner
        alertas={dados?.alertas}
        afetadaPorAlerta={Boolean(dados?.afetadaPorAlerta)}
        onPress={navigation ? () => navigation.navigate('Alertas') : undefined}
      />
      <TouchableOpacity
        style={styles.botaoReportarLinha}
        onPress={() =>
          navigation?.navigate('ReportarDivergencia', {
            tipo: 'ITINERARIO',
            linhaId: linhaRef,
          })
        }
      >
        <Text style={styles.botaoReportarLinhaTexto}>Reportar divergência</Text>
      </TouchableOpacity>

      {sentidoUnico ? (
        <View style={styles.sentidoUnicoBadge}>
          <Text style={styles.sentidoUnicoTexto}>{rotuloSentidoUnico}</Text>
        </View>
      ) : (
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
      )}

      {erro && <Text style={styles.erro}>{erro}</Text>}
      {!dados && !erro && <ActivityIndicator size="large" color="#006666" />}
      {dados && paradas.length === 0 && (
        <Text style={styles.vazio}>Nenhuma parada neste sentido.</Text>
      )}

      <FlatList
        data={paradas}
        keyExtractor={(item) => `${item.sequencia}-${item.paradaId}`}
        renderItem={({ item }) => {
          const temAlerta = Boolean(
            item.afetadaPorAlerta || (Array.isArray(item.alertas) && item.alertas.length > 0)
          );
          return (
            <View style={[styles.paradaCard, temAlerta && styles.paradaCardAlerta]}>
              <View style={styles.seqBadge}>
                <Text style={styles.seqTexto}>{item.sequencia}</Text>
              </View>
              <View style={styles.paradaInfo}>
                <Text style={styles.paradaNome}>{item.nome}</Text>
                <Text style={styles.paradaCodigo}>Parada {item.codigo}</Text>
                <AlertaBadge alertas={item.alertas} afetadaPorAlerta={item.afetadaPorAlerta} />
                {Array.isArray(item.alertas) && item.alertas[0]?.descricao ? (
                  <Text style={styles.paradaAlertaDescricao} numberOfLines={2}>
                    {item.alertas[0].descricao}
                  </Text>
                ) : null}
              </View>
              <FavoritoEstrela
                item={{ tipo: 'PARADA', paradaId: String(item.paradaId) }}
                tamanho={20}
              />
              <TouchableOpacity
                style={styles.botaoReportarParada}
                onPress={() =>
                  navigation?.navigate('ReportarDivergencia', {
                    tipo: 'PARADA',
                    linhaId: linhaRef,
                    paradaId: item.codigo || String(item.paradaId),
                  })
                }
              >
                <Text style={styles.botaoReportarParadaTexto}>Reportar</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  header: { marginBottom: 12, alignItems: 'center' },
  numeroLinha: { fontSize: 24, fontWeight: 'bold', color: '#006666' },
  nomeLinha: { fontSize: 16, color: '#666' },
  botaoReportarLinha: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#C62828', marginBottom: 14 },
  botaoReportarLinhaTexto: { color: '#C62828', fontWeight: 'bold', fontSize: 13 },
  tabContainer: { flexDirection: 'row', marginBottom: 16 },
  sentidoUnicoBadge: { alignSelf: 'flex-start', backgroundColor: '#E0F2F1', borderWidth: 1, borderColor: '#B2DFDB', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 16, marginBottom: 16 },
  sentidoUnicoTexto: { color: '#006666', fontWeight: 'bold', fontSize: 13 },
  tab: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20, backgroundColor: '#E0E0E0', marginRight: 8 },
  tabAtiva: { backgroundColor: '#006666' },
  tabTexto: { color: '#FFF', fontWeight: 'bold' },
  erro: { color: '#B00020', marginVertical: 16 },
  vazio: { color: '#666', marginVertical: 16 },
  paradaCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  paradaCardAlerta: { backgroundColor: '#FFFBEB', borderLeftWidth: 4, borderLeftColor: '#D97706', paddingHorizontal: 10, borderRadius: 8, marginBottom: 6 },
  seqBadge: { backgroundColor: '#006666', borderRadius: 14, minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginRight: 12, paddingHorizontal: 6 },
  seqTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  paradaInfo: { flex: 1 },
  paradaNome: { fontSize: 15, fontWeight: '600', color: '#333' },
  paradaCodigo: { fontSize: 12, color: '#666' },
  paradaAlertaDescricao: { fontSize: 12, color: '#92400E', marginTop: 4 },
  botaoReportarParada: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#C62828', marginLeft: 8 },
  botaoReportarParadaTexto: { color: '#C62828', fontSize: 12, fontWeight: '600' },
});