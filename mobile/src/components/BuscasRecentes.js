import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBuscasRecentes } from '../services/storage'; 

export default function BuscasRecentes({ aoSelecionar }) {
  const [buscas, setBuscas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarBuscas = async () => {
    try {
      const dados = await getBuscasRecentes();
      setBuscas(dados);
      setErro('');
    } catch (error) {
      setErro('Não foi possível carregar as buscas recentes.');
    } finally {
      setCarregando(false);
    }
  };

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
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => aoSelecionar(item)}>
            <Text style={styles.texto}>{item.origem} → {item.destino}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}