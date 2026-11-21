import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function ConfiguracoesScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null);

  useFocusEffect(
    useCallback(() => {
      async function carregarUsuario() {
        const userStorage = await AsyncStorage.getItem('@rotasdf_usuario');
        if (userStorage) {
          setUsuario(JSON.parse(userStorage));
        } else {
          setUsuario(null);
        }
      }
      carregarUsuario();
    }, [])
  );

  const limparHistorico = async () => {
    try {
      await AsyncStorage.removeItem('@rotasdf_buscas_recentes');
      if (Platform.OS === 'web') {
        window.alert("Histórico de buscas limpo!");
      } else {
        Alert.alert("Sucesso", "Histórico de buscas limpo!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const executarLogout = async () => {
    await AsyncStorage.removeItem('@rotasdf_token');
    await AsyncStorage.removeItem('@rotasdf_usuario');
    setUsuario(null);
    navigation.navigate('Linhas');
  };

  const sair = async () => {
    if (Platform.OS === 'web') {
      const confirmou = window.confirm("Deseja realmente sair da conta?");
      if (confirmou) {
        await executarLogout();
      }
    } else {
      Alert.alert("Sair", "Deseja realmente sair da conta?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: executarLogout }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.perfilCard}>
        <Ionicons name={usuario ? "person-circle" : "person-circle-outline"} size={80} color="#006666" />
        <Text style={styles.nome}>{usuario ? usuario.nome : 'Passageiro Anônimo'}</Text>
        <Text style={styles.email}>{usuario ? usuario.email : 'Você não está logado'}</Text>

        {!usuario && (
          <TouchableOpacity 
            style={styles.botaoLogin} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.botaoLoginTexto}>Fazer Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.opcoesContainer}>
        <TouchableOpacity style={styles.opcaoItem} onPress={() => navigation.navigate('Alertas')}>
          <Ionicons name="warning-outline" size={24} color="#666" />
          <Text style={styles.opcaoTexto}>Alertas de serviço</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.opcaoItem} onPress={() => navigation.navigate('ReportarDivergencia')}>
          <Ionicons name="flag-outline" size={24} color="#666" />
          <Text style={styles.opcaoTexto}>Reportar divergência</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.opcaoItem} onPress={limparHistorico}>
          <Ionicons name="trash-outline" size={24} color="#666" />
          <Text style={styles.opcaoTexto}>Limpar histórico de buscas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.opcaoItem} onPress={() => navigation.navigate('Admin')}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
            <Text style={styles.opcaoTexto}>Área do administrador</Text>
          </TouchableOpacity>

        {usuario && usuario.tipo !== 'ADMIN' && (
          <TouchableOpacity style={styles.opcaoItem} onPress={() => navigation.navigate('ExcluirConta')}>
            <Ionicons name="person-remove-outline" size={24} color="#666" />
            <Text style={styles.opcaoTexto}>Excluir minha conta</Text>
          </TouchableOpacity>
        )}

        {usuario && (
          <TouchableOpacity style={styles.opcaoItem} onPress={sair}>
            <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
            <Text style={[styles.opcaoTexto, { color: '#D32F2F' }]}>Sair da conta</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20 },
  perfilCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 2 },
  nome: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 12 },
  email: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 16 },
  botaoLogin: { backgroundColor: '#006666', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20 },
  botaoLoginTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  opcoesContainer: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, elevation: 2 },
  opcaoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  opcaoTexto: { fontSize: 16, color: '#333', marginLeft: 16, fontWeight: '500' }
});