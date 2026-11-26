import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getLinhas, excluirLinha } from '../services/api';
import { mostrarAviso, confirmarAcao } from '../utils/dialogos';

export default function ManterLinhasParadasScreen({ navigation }) {
  const [linhas, setLinhas] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregarLinhas = async () => {
    setCarregando(true);
    try {
      setLinhas(await getLinhas());
    } catch (error) {
      mostrarAviso('Erro', 'Não foi possível carregar as linhas.');
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarLinhas();
    }, [])
  );

  const texto = busca.trim().toLowerCase();
  const linhasEncontradas = texto
    ? linhas.filter(
        (l) => l.codigo.toLowerCase().includes(texto) || l.nome.toLowerCase().includes(texto)
      )
    : linhas;

  const confirmarExclusao = (linha) => {
    confirmarAcao(
      'Excluir linha',
      `A linha ${linha.codigo} será excluída junto com todas as viagens, horários e favoritos dela. Esta ação não pode ser desfeita.`,
      'Excluir',
      async () => {
        try {
          const token = await AsyncStorage.getItem('@rotasdf_token');
          await excluirLinha(token, linha.id);
          carregarLinhas();
        } catch (error) {
          mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível excluir a linha.');
        }
      }
    );
  };

  const renderLinha = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.titulo}>
        {item.codigo} - {item.nome}
      </Text>
      {item.operadora ? <Text style={styles.detalhe}>{item.operadora}</Text> : null}
      <View style={styles.acoes}>
        <TouchableOpacity style={styles.botaoEditar} onPress={() => navigation.navigate('NovaLinha', { linha: item })}>
          <Text style={styles.botaoEditarTexto}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoExcluir} onPress={() => confirmarExclusao(item)}>
          <Text style={styles.botaoExcluirTexto}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.botaoNovo} onPress={() => navigation.navigate('NovaLinha')}>
        <Text style={styles.botaoNovoTexto}>Nova linha</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar linha por número ou nome"
      />

      {carregando ? (
        <ActivityIndicator size="large" color="#006666" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={linhasEncontradas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLinha}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhuma linha encontrada.</Text>}
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  botaoNovo: { backgroundColor: '#006666', borderRadius: 8, padding: 14, alignItems: 'center', margin: 16, marginBottom: 12 },
  botaoNovoTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  input: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', padding: 12, fontSize: 16, marginHorizontal: 16 },
  item: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  detalhe: { fontSize: 13, color: '#666', marginTop: 4 },
  acoes: { flexDirection: 'row', marginTop: 12 },
  botaoEditar: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#006666', padding: 10, alignItems: 'center', marginRight: 8 },
  botaoEditarTexto: { color: '#006666', fontWeight: 'bold' },
  botaoExcluir: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#C62828', padding: 10, alignItems: 'center' },
  botaoExcluirTexto: { color: '#C62828', fontWeight: 'bold' },
  vazio: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 16 },
});
