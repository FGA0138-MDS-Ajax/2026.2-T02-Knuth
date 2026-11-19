import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { listarAlertasAdmin, encerrarAlerta, excluirAlerta } from '../services/api';

const ROTULOS = {
  DESVIO: 'Desvio',
  SUSPENSAO: 'Suspensão',
  ALTERACAO_HORARIO: 'Alteração de horário',
  PARALISACAO: 'Paralisação'
};

const formatarData = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const situacao = (alerta) => {
  const agora = new Date();
  if (alerta.encerrado_em) return 'Encerrado';
  if (new Date(alerta.data_fim) < agora) return 'Expirado';
  if (new Date(alerta.data_inicio) > agora) return 'Agendado';
  return 'Vigente';
};

export default function GerenciarAlertasScreen({ navigation }) {
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    setCarregando(true);
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      setAlertas(await listarAlertasAdmin(token));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os alertas.');
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  const confirmarEncerramento = (alerta) => {
    Alert.alert('Encerrar alerta', 'O alerta deixará de aparecer para os passageiros.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Encerrar',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('@rotasdf_token');
            await encerrarAlerta(token, alerta.id);
            carregar();
          } catch (error) {
            Alert.alert('Erro', error?.response?.data?.detalhes || 'Não foi possível encerrar.');
          }
        }
      }
    ]);
  };

    const confirmarExclusao = (alerta) => {
    Alert.alert('Excluir alerta', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('@rotasdf_token');
            await excluirAlerta(token, alerta.id);
            carregar();
          } catch (error) {
            Alert.alert('Erro', error?.response?.data?.detalhes || 'Não foi possível excluir.');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => {
    const estado = situacao(item);
    return (
      <View style={styles.item}>
        <View style={styles.topo}>
          <Text style={styles.tipo}>{ROTULOS[item.tipo] || item.tipo}</Text>
          <Text style={[styles.estado, estado === 'Vigente' && styles.estadoVigente]}>{estado}</Text>
        </View>
        <Text style={styles.descricao}>{item.descricao}</Text>
        <Text style={styles.detalhe}>
          {formatarData(item.data_inicio)} até {formatarData(item.data_fim)}
        </Text>
        {item.linhas && item.linhas.length > 0 && (
          <Text style={styles.detalhe}>Linhas: {item.linhas.join(', ')}</Text>
        )}
        {estado === 'Vigente' || estado === 'Agendado' ? (
          <TouchableOpacity style={styles.botaoEncerrar} onPress={() => confirmarEncerramento(item)}>
            <Text style={styles.botaoEncerrarTexto}>Encerrar alerta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.botaoEncerrar} onPress={() => confirmarExclusao(item)}>
            <Text style={styles.botaoEncerrarTexto}>Excluir alerta</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.botaoNovo} onPress={() => navigation.navigate('NovoAlerta')}>
        <Text style={styles.botaoNovoTexto}>Novo alerta</Text>
      </TouchableOpacity>

      {carregando ? (
        <ActivityIndicator size="large" color="#006666" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum alerta cadastrado.</Text>}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  botaoNovo: { backgroundColor: '#006666', borderRadius: 8, padding: 14, alignItems: 'center', margin: 16 },
  botaoNovoTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  item: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tipo: { fontSize: 14, fontWeight: 'bold', color: '#D97706' },
  estado: { fontSize: 13, fontWeight: '600', color: '#666' },
  estadoVigente: { color: '#006666' },
  descricao: { fontSize: 16, color: '#333', marginBottom: 6 },
  detalhe: { fontSize: 13, color: '#666', marginTop: 2 },
  botaoEncerrar: { borderRadius: 8, borderWidth: 1, borderColor: '#C62828', padding: 10, alignItems: 'center', marginTop: 12 },
  botaoEncerrarTexto: { color: '#C62828', fontWeight: 'bold' },
  vazio: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 16 }
});