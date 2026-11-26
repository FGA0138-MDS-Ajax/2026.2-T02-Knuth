import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProximasPartidasParada } from '../services/api';
import AlertaBanner from '../components/AlertaBanner';
import FavoritoEstrela from '../components/FavoritoEstrela';
import FavoritosCarregador from '../components/FavoritosCarregador';
import { formatarDuracao } from '../utils/formatarDuracao';

const ROTULO_TIPO_DIA = {
  DIA_UTIL: 'Dia útil',
  SABADO: 'Sábado',
  DOMINGO_FERIADO: 'Domingo / Feriado',
};

const MENSAGEM_SEM_PARTIDAS = 'Não há mais partidas previstas para hoje nesta parada.';

function formatarTempoRestante(minutos) {
  if (minutos === null || minutos === undefined) return '';
  if (Number(minutos) <= 0) return 'Agora';
  return `em ${formatarDuracao(minutos)}`;
}

// RF11 - Consulta próximas partidas programadas em uma parada em ordem cronológica
export default function ProximasPartidasScreen({ route, navigation }) {
  const { paradaId, paradaNome, paradaCodigo } = route?.params || {};
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregarPartidas = useCallback(
    async (silencioso = false) => {
      if (!paradaId) {
        setErro('Parada não informada.');
        setCarregando(false);
        setAtualizando(false);
        return;
      }

      if (silencioso) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }
      setErro(null);

      try {
        const resposta = await getProximasPartidasParada(paradaId);
        setDados(resposta);
      } catch (err) {
        console.error('Erro ao carregar próximas partidas da parada:', err);
        setErro('Não foi possível carregar as próximas partidas desta parada.');
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [paradaId]
  );

  useEffect(() => {
    carregarPartidas(false);
  }, [carregarPartidas]);

  const nomeExibido = dados?.parada?.nome || paradaNome || 'Parada';
  const codigoExibido = dados?.parada?.codigo || paradaCodigo || null;
  const partidas = Array.isArray(dados?.partidas) ? dados.partidas : [];
  const rotuloDia = dados?.tipoDia ? ROTULO_TIPO_DIA[dados.tipoDia] || dados.tipoDia : null;

  const renderPartida = ({ item }) => {
    const sentidoTexto = item.sentido === 'VOLTA' ? 'Volta' : 'Ida';
    const tempoRestante = formatarTempoRestante(item.minutosRestantes);

    return (
      <TouchableOpacity
        style={styles.partidaCard}
        onPress={() => navigation?.navigate('Horarios', { linhaId: item.linhaId })}
      >
        <View style={styles.linhaBadge}>
          <Text style={styles.linhaCodigo}>{item.linhaCodigo}</Text>
        </View>

        <View style={styles.partidaInfo}>
          <Text style={styles.linhaNome} numberOfLines={2}>
            {item.linhaNome}
          </Text>
          <Text style={styles.sentidoTexto} numberOfLines={1}>
            Sentido {sentidoTexto}
            {item.destino ? ` • ${item.destino}` : ''}
          </Text>
        </View>

        <View style={styles.horarioColuna}>
          <Text style={styles.horarioTexto}>{item.horario}</Text>
          {tempoRestante ? <Text style={styles.restanteTexto}>{tempoRestante}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FavoritosCarregador navigation={navigation} />

      <View style={styles.headerCard}>
        <View style={styles.headerTopo}>
          <View style={styles.headerTextos}>
            <Text style={styles.paradaNome}>{nomeExibido}</Text>
            {codigoExibido ? (
              <Text style={styles.paradaCodigo}>Parada {codigoExibido}</Text>
            ) : null}
          </View>
          {paradaId ? (
            <FavoritoEstrela item={{ tipo: 'PARADA', paradaId: String(paradaId) }} tamanho={22} />
          ) : null}
        </View>

        <View style={styles.headerRodape}>
          <Text style={styles.referenciaTexto}>
            {dados?.horarioReferencia
              ? `A partir de ${dados.horarioReferencia}${rotuloDia ? ` • ${rotuloDia}` : ''}`
              : 'Consultando horário atual...'}
          </Text>
          <TouchableOpacity
            style={styles.botaoAtualizar}
            onPress={() => carregarPartidas(true)}
            disabled={carregando || atualizando}
          >
            <Ionicons name="refresh" size={14} color="#006666" />
            <Text style={styles.botaoAtualizarTexto}>Atualizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AlertaBanner
        alertas={dados?.alertas}
        afetadaPorAlerta={Boolean(dados?.afetadaPorAlerta)}
        onPress={navigation ? () => navigation.navigate('Alertas') : undefined}
      />

      {carregando ? (
        <View style={styles.centralizado}>
          <ActivityIndicator size="large" color="#006666" />
        </View>
      ) : erro ? (
        <View style={styles.estadoCaixa}>
          <Text style={styles.erroTexto}>{erro}</Text>
          <TouchableOpacity style={styles.botaoTentar} onPress={() => carregarPartidas(false)}>
            <Text style={styles.botaoTentarTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : partidas.length === 0 ? (
        <View style={styles.estadoCaixa}>
          <Ionicons name="time-outline" size={36} color="#666" style={styles.iconeVazio} />
          <Text style={styles.vazioTexto}>{dados?.mensagem || MENSAGEM_SEM_PARTIDAS}</Text>
        </View>
      ) : (
        <FlatList
          data={partidas}
          keyExtractor={(item, index) => `${item.linhaId}-${item.sentido}-${item.horario}-${index}`}
          renderItem={renderPartida}
          refreshing={atualizando}
          onRefresh={() => carregarPartidas(true)}
          contentContainerStyle={styles.listaConteudo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  headerCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  headerTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextos: { flex: 1, marginRight: 10 },
  paradaNome: { fontSize: 18, fontWeight: 'bold', color: '#006666' },
  paradaCodigo: { fontSize: 13, color: '#666', marginTop: 2 },
  headerRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  referenciaTexto: { fontSize: 12, color: '#555', flex: 1, marginRight: 8 },
  botaoAtualizar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#E6F2F2',
  },
  botaoAtualizarTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#006666',
    marginLeft: 4,
  },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  estadoCaixa: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
    elevation: 1,
  },
  iconeVazio: { marginBottom: 10 },
  vazioTexto: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
  erroTexto: { fontSize: 14, color: '#B00020', textAlign: 'center', marginBottom: 14 },
  botaoTentar: {
    backgroundColor: '#006666',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  botaoTentarTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  listaConteudo: { paddingBottom: 16 },
  partidaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  linhaBadge: {
    backgroundColor: '#006666',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 12,
    minWidth: 64,
    alignItems: 'center',
  },
  linhaCodigo: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  partidaInfo: { flex: 1, marginRight: 10 },
  linhaNome: { fontSize: 14, fontWeight: '600', color: '#333' },
  sentidoTexto: { fontSize: 12, color: '#666', marginTop: 2 },
  horarioColuna: { alignItems: 'flex-end' },
  horarioTexto: { fontSize: 18, fontWeight: 'bold', color: '#006666' },
  restanteTexto: { fontSize: 12, color: '#0F766E', fontWeight: '600', marginTop: 2 },
});
