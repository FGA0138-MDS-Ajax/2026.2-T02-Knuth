import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLinhas } from '../services/api';
import FavoritosCarregador from '../components/FavoritosCarregador';
import FavoritoEstrela from '../components/FavoritoEstrela';
import RodapeNavegacao from '../components/RodapeNavegacao';

export default function LinhasScreen({ navigation }) {
  const [busca, setBusca] = useState('');
  const [linhas, setLinhas] = useState([]); 
  const [carregando, setCarregando] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Alertas')} style={{ marginRight: 16 }}>
            <Ionicons name="warning-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Configuracoes')} style={{ marginRight: 16 }}>
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    async function carregarLinhas() {
      try {
        const dados = await getLinhas(); 
        setLinhas(dados);
      } catch (error) {
        console.error(error);
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
        <Text style={{ marginTop: 10, color: '#666' }}>Carregando linhas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={linhasFiltradas}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <FavoritosCarregador navigation={navigation} />
            <View style={styles.botoesAcaoContainer}>
              <TouchableOpacity 
                style={styles.botaoTrajeto}
                onPress={() => navigation.navigate('BuscarTrajeto')}
              >
                <Ionicons name="navigate-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.botaoTrajetoTexto}>Planejar Viagem</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.botaoAlertas}
                onPress={() => navigation.navigate('Alertas')}
              >
                <Ionicons name="warning-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.botaoAlertasTexto}>Alertas</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Pesquisar por número ou nome..."
                placeholderTextColor="#888"
                value={busca}
                onChangeText={setBusca}
              />
              {busca.length > 0 && (
                <TouchableOpacity onPress={() => setBusca('')} style={styles.clearIcon}>
                  <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.containerCentered}>
            <Ionicons name="bus-outline" size={50} color="#CCC" />
            <Text style={styles.textoVazio}>Nenhuma linha encontrada para "{busca}"</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('Horarios', { linhaId: item.id })}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.codigo}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.nomeLinha} numberOfLines={2}>{item.nome}</Text>
              <Text style={styles.toqueDetalhes}>Toque para ver horários</Text>
            </View>
            <FavoritoEstrela item={{ tipo: 'LINHA', linhaId: item.id }} />
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        )}
      />
     <RodapeNavegacao navigation={navigation} ativa="Linhas" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingTop: 16 },
  containerCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  botoesAcaoContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  botaoTrajeto: { flex: 1, flexDirection: 'row', backgroundColor: '#004C4C', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  botaoTrajetoTexto: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  botaoAlertas: { flexDirection: 'row', backgroundColor: '#D97706', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  botaoAlertasTexto: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', marginBottom: 16, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#333' },
  clearIcon: { padding: 4 },
  textoVazio: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 12 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12, alignItems: 'center', elevation: 1 },
  badge: { backgroundColor: '#006666', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginRight: 16 },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  infoContainer: { flex: 1 },
  nomeLinha: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  toqueDetalhes: { fontSize: 12, color: '#666' }
});