import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAlertas } from '../services/api';

const TIPO_CONFIG = {
  DESVIO: {
    rotulo: 'Desvio',
    cor: '#D97706',
    fundo: '#FEF3C7',
    icone: 'trail-sign-outline'
  },
  SUSPENSAO: {
    rotulo: 'Suspensão',
    cor: '#DC2626',
    fundo: '#FEE2E2',
    icone: 'alert-circle-outline'
  },
  PARALISACAO: {
    rotulo: 'Paralisação',
    cor: '#7C3AED',
    fundo: '#EDE9FE',
    icone: 'hand-left-outline'
  },
  ALTERACAO_HORARIO: {
    rotulo: 'Alteração de Horário',
    cor: '#2563EB',
    fundo: '#DBEAFE',
    icone: 'time-outline'
  }
};

export default function AlertasScreen({ navigation }) {
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [isAdmin, setIsAdmin] = useState(false);

  const carregarAlertas = useCallback(async () => {
    try {
      setErro(null);
      const dados = await getAlertas();
      setAlertas(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
      setErro('Não foi possível carregar os alertas vigentes no momento.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarAlertas();
    async function checarAdmin() {
      const usuarioStorage = await AsyncStorage.getItem('@rotasdf_usuario');
      if (usuarioStorage) {
        try {
          const user = JSON.parse(usuarioStorage);
          if (user?.tipo === 'ADMIN' || user?.email?.includes('admin')) {
            setIsAdmin(true);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    checarAdmin();
  }, [carregarAlertas]);

  const onRefresh = () => {
    setAtualizando(true);
    carregarAlertas();
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '';
    try {
      const d = new Date(dataIso);
      if (isNaN(d.getTime())) return dataIso;
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      const horas = String(d.getHours()).padStart(2, '0');
      const minutos = String(d.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
    } catch {
      return dataIso;
    }
  };

  const alertasFiltrados = alertas.filter(item => {
    if (filtroTipo === 'TODOS') return true;
    return item.tipo === filtroTipo;
  });

  if (carregando) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#006666" />
        <Text style={styles.textoCarregando}>Consultando alertas vigentes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtros rápidos por categoria */}
      <View style={styles.filtrosWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosContainer}>
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'DESVIO', label: 'Desvios' },
            { id: 'SUSPENSAO', label: 'Suspensões' },
            { id: 'ALTERACAO_HORARIO', label: 'Horários' },
            { id: 'PARALISACAO', label: 'Paralisações' },
          ].map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filtroChip, filtroTipo === f.id && styles.filtroChipAtivo]}
              onPress={() => setFiltroTipo(f.id)}
            >
              <Text style={[styles.filtroChipTexto, filtroTipo === f.id && styles.filtroChipTextoAtivo]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Alertas */}
      <FlatList
        data={alertasFiltrados}
        keyExtractor={item => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listaConteudo}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={onRefresh} colors={['#006666']} />
        }
        ListHeaderComponent={
          erro ? (
            <View style={styles.erroCard}>
              <Ionicons name="warning" size={32} color="#DC2626" />
              <Text style={styles.erroTexto}>{erro}</Text>
              <TouchableOpacity style={styles.botaoTentarNovamente} onPress={carregarAlertas}>
                <Text style={styles.botaoTentarNovamenteTexto}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !erro && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#059669" />
              </View>
              <Text style={styles.emptyTitulo}>Operação Normal</Text>
              <Text style={styles.emptyDescricao}>
                Não há nenhum alerta ou imprevisto vigente no momento. Todas as linhas e paradas estão operando normalmente.
              </Text>
              <TouchableOpacity style={styles.botaoRecarregar} onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={18} color="#006666" style={{ marginRight: 6 }} />
                <Text style={styles.botaoRecarregarTexto}>Atualizar agora</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => {
          const config = TIPO_CONFIG[item.tipo] || {
            rotulo: item.tipo,
            cor: '#475569',
            fundo: '#F1F5F9',
            icone: 'information-circle-outline'
          };

          return (
            <View style={styles.card}>
              {/* Cabeçalho do Card */}
              <View style={styles.cardHeader}>
                <View style={[styles.badgeTipo, { backgroundColor: config.fundo }]}>
                  <Ionicons name={config.icone} size={16} color={config.cor} style={{ marginRight: 6 }} />
                  <Text style={[styles.badgeTipoTexto, { color: config.cor }]}>
                    {config.rotulo.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Título (quando informado) e Descrição */}
              {item.titulo ? <Text style={styles.tituloAlerta}>{item.titulo}</Text> : null}
              <Text style={styles.descricao}>{item.descricao}</Text>

              {/* Período de Vigência */}
              <View style={styles.vigenciaContainer}>
                <Ionicons name="calendar-outline" size={16} color="#666" style={{ marginRight: 6 }} />
                <Text style={styles.vigenciaTexto}>
                  Vigência: {formatarData(item.data_inicio)} até {formatarData(item.data_fim)}
                </Text>
              </View>

              {/* Linhas Afetadas */}
              {Array.isArray(item.linhas_afetadas) && item.linhas_afetadas.length > 0 && (
                <View style={styles.itensAfetadosSecao}>
                  <Text style={styles.itensAfetadosTitulo}>Linhas afetadas:</Text>
                  <View style={styles.chipsContainer}>
                    {item.linhas_afetadas.map((l, idx) => (
                      <View key={idx} style={styles.chipLinha}>
                        <Ionicons name="bus-outline" size={13} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.chipLinhaTexto}>{l.codigo || l.nome}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Paradas Afetadas */}
              {Array.isArray(item.paradas_afetadas) && item.paradas_afetadas.length > 0 && (
                <View style={styles.itensAfetadosSecao}>
                  <Text style={styles.itensAfetadosTitulo}>Paradas afetadas:</Text>
                  <View style={styles.chipsContainer}>
                    {item.paradas_afetadas.map((p, idx) => (
                      <View key={idx} style={styles.chipParada}>
                        <Ionicons name="location-outline" size={13} color="#006666" style={{ marginRight: 4 }} />
                        <Text style={styles.chipParadaTexto}>{p.nome || p.codigo}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5'
  },
  textoCarregando: {
    marginTop: 12,
    fontSize: 15,
    color: '#666'
  },
  filtrosWrapper: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10
  },
  filtrosContainer: {
    paddingHorizontal: 16,
    gap: 8
  },
  filtroChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  filtroChipAtivo: {
    backgroundColor: '#006666',
    borderColor: '#006666'
  },
  filtroChipTexto: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500'
  },
  filtroChipTextoAtivo: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  listaConteudo: {
    padding: 16,
    paddingBottom: 32
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  badgeTipo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  badgeTipoTexto: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  tituloAlerta: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6
  },
  descricao: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 12
  },
  vigenciaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  vigenciaTexto: {
    fontSize: 12,
    color: '#4B5563'
  },
  itensAfetadosSecao: {
    marginTop: 6
  },
  itensAfetadosTitulo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  chipLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006666',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  chipLinhaTexto: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  chipParada: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B2D8D8'
  },
  chipParadaTexto: {
    color: '#006666',
    fontSize: 12,
    fontWeight: '500'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginTop: 20,
    elevation: 1
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  emptyTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 8
  },
  emptyDescricao: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20
  },
  botaoRecarregar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E6F0F0'
  },
  botaoRecarregarTexto: {
    color: '#006666',
    fontSize: 14,
    fontWeight: '600'
  },
  erroCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  erroTexto: {
    color: '#991B1B',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10
  },
  botaoTentarNovamente: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  botaoTentarNovamenteTexto: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
