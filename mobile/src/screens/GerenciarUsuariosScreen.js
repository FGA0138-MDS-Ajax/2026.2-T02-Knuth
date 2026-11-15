import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { listarUsuarios } from '../services/api';

const FILTROS = [
  { rotulo: 'Todos', valor: undefined },
  { rotulo: 'Administradores', valor: 'ADMIN' },
  { rotulo: 'Passageiros', valor: 'PASSAGEIRO' }
];

export default function GerenciarUsuariosScreen({ navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState(undefined);
  const [meuId, setMeuId] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const carregar = async () => {
        setCarregando(true);
        try {
          const token = await AsyncStorage.getItem('@rotasdf_token');
          const salvo = await AsyncStorage.getItem('@rotasdf_usuario');
          setMeuId(salvo ? JSON.parse(salvo).id : null);
          const dados = await listarUsuarios(token, filtro);
          setUsuarios(dados);
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar os usuários.');
        } finally {
          setCarregando(false);
        }
      };

      carregar();
    }, [filtro])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('EditarUsuario', { usuario: item, ehVoce: item.id === meuId })}
    >
      <View style={styles.itemTexto}>
        <Text style={styles.nome}>
          {item.nome}
          {item.id === meuId ? ' (você)' : ''}
        </Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <Text style={[styles.tipo, item.tipo === 'ADMIN' && styles.tipoAdmin]}>
        {item.tipo === 'ADMIN' ? 'Admin' : 'Passageiro'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll} contentContainerStyle={styles.filtros}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.rotulo}
            style={[styles.filtro, filtro === f.valor && styles.filtroAtivo]}
            onPress={() => setFiltro(f.valor)}
          >
            <Text style={[styles.filtroTexto, filtro === f.valor && styles.filtroTextoAtivo]}>{f.rotulo}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {carregando ? (
        <ActivityIndicator size="large" color="#006666" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum usuário encontrado.</Text>}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  filtrosScroll: { flexGrow: 0 },
  filtros: { flexDirection: 'row', padding: 16, paddingBottom: 0 },
  filtro: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', marginRight: 8 },
  filtroAtivo: { backgroundColor: '#006666', borderColor: '#006666' },
  filtroTexto: { color: '#333', fontSize: 14 },
  filtroTextoAtivo: { color: '#FFF', fontWeight: 'bold' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  itemTexto: { flex: 1 },
  nome: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  tipo: { fontSize: 13, color: '#666', fontWeight: '600' },
  tipoAdmin: { color: '#006666' },
  vazio: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 16 }
});