import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { AlertaBadge } from '../components/AlertaBanner';
import FavoritoEstrela from '../components/FavoritoEstrela';
import { formatarDuracao } from '../utils/formatarDuracao';
import {
  OPCOES_ORDENACAO,
  ordenarEFiltrarTrajetos,
  formatarCaminhada,
  obterSeloMelhorOpcao,
} from '../utils/ordenarTrajetos';

function formatarBaldeacoes(quantidade) {
  if (quantidade === 0) return 'Direto';
  if (quantidade === 1) return '1 baldeação';
  return `${quantidade} baldeações`;
}

export default function ResultadoTrajetoScreen({ route, navigation }) {
  const { opcoes = [], origem, destino } = route.params || {};
  const [criterioOrdenacao, setCriterioOrdenacao] = useState(null);
  const [somenteDiretos, setSomenteDiretos] = useState(false);

  const opcoesExibidas = useMemo(
    () =>
      ordenarEFiltrarTrajetos(opcoes, {
        criterio: criterioOrdenacao,
        somenteDiretos,
      }),
    [opcoes, criterioOrdenacao, somenteDiretos]
  );

  const seloMelhor = obterSeloMelhorOpcao(criterioOrdenacao);

  const renderOpcao = ({ item, index }) => {
    const temAlerta = Boolean(
      item.afetadaPorAlerta || (Array.isArray(item.alertas) && item.alertas.length > 0)
    );
    const resumoAlerta =
      Array.isArray(item.alertas) && item.alertas.length > 0
        ? item.alertas[0].titulo || item.alertas[0].descricao
        : null;
    const textoCaminhada = formatarCaminhada(item.caminhadaMetros);
    const exibirSeloMelhor = Boolean(seloMelhor && index === 0 && opcoesExibidas.length > 1);

    return (
      <TouchableOpacity
        style={[styles.card, temAlerta && styles.cardComAlerta]}
        onPress={() => navigation.navigate('TrajetoDetalhe', { opcaoTrajeto: item })}
      >
        {exibirSeloMelhor ? (
          <View style={styles.seloMelhor}>
            <Text style={styles.seloMelhorTexto}>{seloMelhor}</Text>
          </View>
        ) : null}

        <View style={styles.headerCard}>
          <Text style={styles.tempoTotal}>{formatarDuracao(item.duracaoMinutos)}</Text>
          <Text style={styles.horario}>
            {item.partida} - {item.chegada}
          </Text>
        </View>

        <View style={styles.detalhes}>
          <Text style={styles.detalheTexto}>{formatarBaldeacoes(item.baldeacoes)}</Text>
          {textoCaminhada ? (
            <Text style={styles.caminhadaTexto}>• {textoCaminhada}</Text>
          ) : null}
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

      {Array.isArray(opcoes) && opcoes.length > 0 ? (
        <View style={styles.filtrosContainer}>
          <Text style={styles.filtrosLabel}>Ordenar por:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {OPCOES_ORDENACAO.map((opcao) => {
              const ativo = criterioOrdenacao === opcao.id;
              return (
                <TouchableOpacity
                  key={opcao.id}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                  onPress={() => setCriterioOrdenacao(opcao.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                >
                  <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                    {opcao.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.chip, styles.chipFiltro, somenteDiretos && styles.chipFiltroAtivo]}
              onPress={() => setSomenteDiretos((atual) => !atual)}
              accessibilityRole="button"
              accessibilityState={{ selected: somenteDiretos }}
            >
              <Text style={[styles.chipTexto, somenteDiretos && styles.chipTextoAtivo]}>
                Somente diretos
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : null}

      {Array.isArray(opcoes) && opcoes.length > 0 && opcoesExibidas.length === 0 ? (
        <View style={styles.estadoVazioFiltro}>
          <Text style={styles.estadoVazioTexto}>
            Nenhuma opção direta encontrada para este trajeto.
          </Text>
          <TouchableOpacity
            style={styles.botaoLimparFiltro}
            onPress={() => setSomenteDiretos(false)}
          >
            <Text style={styles.botaoLimparFiltroTexto}>Mostrar todas as opções</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={opcoesExibidas}
          keyExtractor={(item, index) =>
            `${item.partida || ''}-${item.chegada || ''}-${item.duracaoMinutos || ''}-${item.baldeacoes || 0}-${index}`
          }
          renderItem={renderOpcao}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#006666', marginBottom: 12 },
  resumoTrajeto: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF7E6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3D9A4',
    marginBottom: 12,
  },
  resumoTrajetoTexto: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', marginRight: 10 },
  filtrosContainer: { marginBottom: 12 },
  filtrosLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  chip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipAtivo: { backgroundColor: '#006666', borderColor: '#006666' },
  chipFiltro: { borderColor: '#0F766E' },
  chipFiltroAtivo: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  chipTexto: { fontSize: 13, fontWeight: '600', color: '#334155' },
  chipTextoAtivo: { color: '#FFF' },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  cardComAlerta: { backgroundColor: '#FFFBEB', borderLeftWidth: 4, borderLeftColor: '#D97706' },
  seloMelhor: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2F1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  seloMelhorTexto: { fontSize: 11, fontWeight: '700', color: '#006666' },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tempoTotal: { fontSize: 20, fontWeight: 'bold', color: '#006666' },
  horario: { fontSize: 14, color: '#666' },
  detalhes: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  detalheTexto: { fontSize: 14, color: '#333', fontWeight: '500' },
  caminhadaTexto: { fontSize: 13, color: '#555' },
  alertaResumo: { fontSize: 12, color: '#92400E', marginTop: 6 },
  estadoVazioFiltro: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  estadoVazioTexto: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 12 },
  botaoLimparFiltro: {
    backgroundColor: '#006666',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  botaoLimparFiltroTexto: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
