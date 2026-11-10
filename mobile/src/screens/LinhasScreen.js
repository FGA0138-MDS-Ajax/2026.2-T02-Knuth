import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getLinhas } from '../services/api';

export default function LinhasScreen({ navigation }) {
  const [busca, setBusca] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarLinhas() {
      try {
        const dados = await getLinhas(); 
        setLinhas(dados);
      } catch (error) {
        console.error("Erro ao buscar linhas na API:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarLinhas();
  }, []);

  const linhasFiltradas = linhas.filter(item => 
    item.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    item.nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (carregando) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#006666" />
        <Text>Carregando linhas do servidor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Consultar Linhas</Text>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar por número ou nome..."
        placeholderTextColor="#888"
        value={busca}
        onChangeText={setBusca}
      />

      <FlatList
        data={linhasFiltradas}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => {
              navigation.navigate('Horarios', { linhaId: item.id });
            }}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.codigo}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.nomeLinha} numberOfLines={2}>{item.nome}</Text>
              <Text style={styles.toqueDetalhes}>Toque para ver horários</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  containerCentered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#006666', marginBottom: 16 },
  searchInput: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', marginBottom: 16, fontSize: 16 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  badge: { backgroundColor: '#006666', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginRight: 16 },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  infoContainer: { flex: 1 },
  nomeLinha: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  toqueDetalhes: { fontSize: 12, color: '#666' }
});