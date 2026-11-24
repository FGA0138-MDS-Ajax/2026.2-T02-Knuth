import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { getItinerario } from '../services/api';
import AlertaBanner, { AlertaBadge } from '../components/AlertaBanner';
import FavoritoEstrela from '../components/FavoritoEstrela';
import FavoritosCarregador from '../components/FavoritosCarregador';
import MapaTrajeto from '../components/MapaTrajeto';
import { construirDadosMapaItinerario } from '../utils/mapaHtml';

export default function ItinerarioScreen({ route, navigation }) {
  const { linhaId } = route.params;
  const [dados, setDados] = useState(null);
  const [sentido, setSentido] = useState('IDA');
  const [modoVisualizacao, setModoVisualizacao] = useState('LISTA');
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
  const linhaRef = dados?.codigo || String(linhaId);
  const dadosMapa = useMemo(
    () => construirDadosMapaItinerario(paradas, dados?.codigo, dados?.cor),
    [paradas, dados?.codigo, dados?.cor]
  );

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

      <View style={styles.controlesRow}>
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

        <View style={styles.modoContainer}>
          <TouchableOpacity
            style={[styles.modoBotao, modoVisualizacao === 'LISTA' && styles.modoBotaoAtivo]}
            onPress={() => setModoVisualizacao('LISTA')}
          >
            <Text style={[styles.modoTexto, modoVisualizacao === 'LISTA' && styles.modoTextoAtivo]}>
              Lista
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modoBotao, modoVisualizacao === 'MAPA' && styles.modoBotaoAtivo]}
            onPress={() => setModoVisualizacao('MAPA')}
          >
            <Text style={[styles.modoTexto, modoVisualizacao === 'MAPA' && styles.modoTextoAtivo]}>
              Mapa
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {erro && <Text style={styles.erro}>{erro}</Text>}
      {!dados && !erro && <ActivityIndicator size="large" color="#006666" />}
      {dados && paradas.length === 0 && (
        <Text style={styles.vazio}>Nenhuma parada neste sentido.</Text>
      )}

      {modoVisualizacao === 'MAPA' && dados && paradas.length > 0 ? (
        <View style={{ flex: 1 }}>
          <MapaTrajeto
            trechos={dadosMapa.trechos}
            marcadores={dadosMapa.marcadores}
            mensagemVazio="Coordenadas indisponíveis para exibir o itinerário no mapa."
          />
        </View>
      ) : (
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
      )}
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
  controlesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  tabContainer: { flexDirection: 'row' },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#E0E0E0', marginRight: 8 },
  tabAtiva: { backgroundColor: '#006666' },
  tabTexto: { color: '#FFF', fontWeight: 'bold' },
  modoContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 18, padding: 3 },
  modoBotao: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 15 },
  modoBotaoAtivo: { backgroundColor: '#006666' },
  modoTexto: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  modoTextoAtivo: { color: '#FFF' },
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