import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getPerfilAdmin } from '../services/api';

export default function AdminScreen({ navigation }) {
  const [status, setStatus] = useState('carregando');
  const [nome, setNome] = useState('');

  useFocusEffect(
    useCallback(() => {
      const verificar = async () => {
        setStatus('carregando');
        try {
          const token = await AsyncStorage.getItem('@rotasdf_token');
          if (!token) {
            setStatus('negado');
            return;
          }

          await getPerfilAdmin(token);

          const usuarioSalvo = await AsyncStorage.getItem('@rotasdf_usuario');
          setNome(usuarioSalvo ? JSON.parse(usuarioSalvo).nome : '');
          setStatus('liberado');
        } catch (error) {
          setStatus('negado');
        }
      };

      verificar();
    }, [])
  );

  const sair = async () => {
    await AsyncStorage.removeItem('@rotasdf_token');
    await AsyncStorage.removeItem('@rotasdf_usuario');
    setStatus('negado');
  };

  if (status === 'carregando') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#006666" />
      </View>
    );
  }

  if (status === 'negado') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Acesso restrito</Text>
        <Text style={styles.texto}>
          Esta área é exclusiva para administradores. Entre com uma conta de administrador para continuar.
        </Text>
        <TouchableOpacity style={styles.botao} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.botaoTexto}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Área do Administrador</Text>
      <Text style={styles.texto}>Olá, {nome}. Seu acesso de administrador está liberado.</Text>
      <TouchableOpacity style={styles.botao} onPress={sair}>
        <Text style={styles.botaoTexto}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 24, justifyContent: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center' },
  texto: { fontSize: 16, color: '#555', marginBottom: 24, textAlign: 'center' },
  botao: { backgroundColor: '#006666', padding: 18, borderRadius: 8, alignItems: 'center' },
  botaoTexto: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});