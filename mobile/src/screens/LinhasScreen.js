import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function LinhasScreen({ navigation }) {
  const [busca, setBusca] = useState('');
  
  const linhas = [
  { id: '2302', codigo: '2302', nome: 'Terminal de Integração de Santa Maria / Rodoviária do Plano Piloto (Eixinho)' },
  { id: '2202', codigo: '2202', nome: 'Terminal de Integração do Gama / Rod. do Plano Piloto' },
  { id: '0.764', codigo: '0.764', nome: 'Itapoã / Rodoviária do Plano Piloto (Via Ponte JK)' },
  { id: '335.1', codigo: '335.1', nome: 'Setor "O" Norte/W3 Sul (SIG - Qd. 716 Sul)' },
];

  const linhasFiltradas = linhas.filter(item => 
    item.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    item.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Consultar Linhas</Text>
      
      {/* Caixa de Pesquisa */}
      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar por número ou nome..."
        placeholderTextColor="#888"
        value={busca}
        onChangeText={setBusca}
      />

      {/* Lista de Linhas */}
      <FlatList
        data={linhasFiltradas}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => {
              // Navega para o ecrã de horários passando o ID da linha selecionada
              navigation.navigate('Horarios', { linhaId: item.id });
            }}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.codigo}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.nomeLinha}>{item.nome}</Text>
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
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#006666', marginBottom: 16 },
  searchInput: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', marginBottom: 16, fontSize: 16 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  badge: { backgroundColor: '#006666', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginRight: 16 },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  infoContainer: { flex: 1 },
  nomeLinha: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  toqueDetalhes: { fontSize: 12, color: '#666' }
});