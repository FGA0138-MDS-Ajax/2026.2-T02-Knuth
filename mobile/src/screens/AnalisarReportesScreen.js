import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { listarReportesAdmin } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

const FILTROS_STATUS = [
  { rotulo: 'Todos', valor: undefined },
  { rotulo: 'Pendentes', valor: 'PENDENTE' },
  { rotulo: 'Procedentes', valor: 'PROCEDENTE' },
  { rotulo: 'Improcedentes', valor: 'IMPROCEDENTE' },
];

const ROTULO_TIPO = {
  HORARIO: 'Horário',
  PARADA: 'Parada',
  ITINERARIO: 'Itinerário',
};

const ESTILO_STATUS = {
  PENDENTE: { rotulo: 'Pendente', corFundo: '#FFF3E0', corTexto: '#E65100' },
  PROCEDENTE: { rotulo: 'Procedente', corFundo: '#E8F5E9', corTexto: '#2E7D32' },
  IMPROCEDENTE: { rotulo: 'Improcedente', corFundo: '#FFEBEE', corTexto: '#C62828' },
};

// RF24 - Listagem e filtragem de reportes enviados pelos passageiros para análise do administrador
export default function AnalisarReportesScreen({ navigation }) {
  const [reportes, setReportes] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState(undefined);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const carregar = async () => {
        setCarregando(true);
        try {
          const token = await AsyncStorage.getItem('@rotasdf_token');
          const filtros = filtroStatus ? { status: filtroStatus } : {};
          const dados = await listarReportesAdmin(token, filtros);
          setReportes(Array.isArray(dados) ? dados : []);
        } catch (error) {
          const msg = error?.response?.data?.detalhes || 'Não foi possível carregar os reportes.';
          mostrarAviso('Erro', msg);
        } finally {
          setCarregando(false);
        }
      };

      carregar();
    }, [filtroStatus])
  );

  const renderItem = ({ item }) => {
    const statusInfo = ESTILO_STATUS[item.status] || ESTILO_STATUS.PENDENTE;
    const tipoRotulo = ROTULO_TIPO[item.tipo] || item.tipo;
    const referencias = [
      item.linhaId ? `Linha: ${item.linhaId}` : null,
      item.paradaId ? `Parada: ${item.paradaId}` : null,
    ].filter(Boolean);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetalheReporte', { reporte: item })}
      >
        <View style={styles.cardCabecalho}>
          <Text style={styles.tipo}>{tipoRotulo}</Text>
          <View style={[styles.badge, { backgroundColor: statusInfo.corFundo }]}>
            <Text style={[styles.badgeTexto, { color: statusInfo.corTexto }]}>
              {statusInfo.rotulo}
            </Text>
          </View>
        </View>

        <Text style={styles.descricao} numberOfLines={3}>
          {item.descricao}
        </Text>

        {referencias.length > 0 && (
          <Text style={styles.referencia}>{referencias.join('  •  ')}</Text>
        )}

        <Text style={styles.autor}>
          Enviado por: {item.usuarioNome || 'Passageiro anônimo'}
        </Text>

        {item.observacaoAdmin ? (
          <Text style={styles.observacao} numberOfLines={2}>
            Correção / Obs.: {item.observacaoAdmin}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScroll}
        contentContainerStyle={styles.filtros}
      >
        {FILTROS_STATUS.map((opcao) => {
          const ativo = filtroStatus === opcao.valor;
          return (
            <TouchableOpacity
              key={opcao.rotulo}
              style={[styles.filtroBotao, ativo && styles.filtroAtivo]}
              onPress={() => setFiltroStatus(opcao.valor)}
            >
              <Text style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}>
                {opcao.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {carregando ? (
        <View style={styles.centralizado}>
          <ActivityIndicator size="large" color="#006666" />
        </View>
      ) : (
        <FlatList
          data={reportes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum reporte encontrado para este filtro.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  filtrosScroll: { flexGrow: 0, paddingVertical: 12 },
  filtros: { paddingHorizontal: 16, gap: 8 },
  filtroBotao: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filtroAtivo: { backgroundColor: '#006666', borderColor: '#006666' },
  filtroTexto: { color: '#333', fontSize: 14, fontWeight: '500' },
  filtroTextoAtivo: { color: '#FFF', fontWeight: 'bold' },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cardCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipo: { fontSize: 15, fontWeight: 'bold', color: '#006666' },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeTexto: { fontSize: 12, fontWeight: 'bold' },
  descricao: { fontSize: 15, color: '#333', marginBottom: 8 },
  referencia: { fontSize: 13, color: '#555', fontWeight: '500', marginBottom: 4 },
  autor: { fontSize: 12, color: '#777' },
  observacao: { fontSize: 13, color: '#2E7D32', marginTop: 8, fontStyle: 'italic' },
  vazio: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 15 },
});
