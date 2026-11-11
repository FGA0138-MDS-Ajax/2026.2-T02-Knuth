import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBuscasRecentes } from '../services/api';

export default function BuscasRecentes({ aoSelecionar }) {
  const [buscas, setBuscas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarBuscas = async () => {
    try {
      const dados = await getBuscasRecentes(5);
      setBuscas(dados);
      setErro('');
    } catch (error) {
      console.error('Erro ao carregar buscas recentes:', error);
      setErro('Não foi possível carregar as buscas recentes.');
    } finally {
      setCarregando(false);
    }
  };

  // Recarrega sempre que a tela aparece (ex.: ao voltar dos resultados)
  useFocusEffect(
    useCallback(() => {
      carregarBuscas();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Buscas recentes</Text>
      {carregando ? <ActivityIndicator color="#006666" /> : null}
      {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}
      {!carregando && !erro && buscas.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma busca recente</Text>
      ) : null}

      <FlatList
        style={styles.lista}
        data={buscas}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => aoSelecionar(item)}>
            <Text style={styles.texto}>{item.origem} → {item.destino}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexShrink: 1 },
  titulo: { fontSize: 16, color: '#333', fontWeight: '600', marginTop: 30, marginBottom: 8 },
  textoErro: { color: 'red', textAlign: 'center', marginBottom: 15, fontSize: 15 },
  vazio: { color: '#666', textAlign: 'center' },
  lista: { flexGrow: 0 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  texto: { fontSize: 15, color: '#333', fontWeight: '500' }
});