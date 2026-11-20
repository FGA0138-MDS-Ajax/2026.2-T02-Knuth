import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUsuario } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const entrar = async () => {
    if (!email || !senha) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    setCarregando(true);
    try {
      const dados = await loginUsuario(email, senha);
      
      await AsyncStorage.setItem('@rotasdf_token', dados.token);
      await AsyncStorage.setItem('@rotasdf_usuario', JSON.stringify(dados.usuario));

      Alert.alert("Bem-vindo!", `Olá, ${dados.usuario.nome}`);
      navigation.goBack(); 
    } catch (error) {
      const msg = error.response?.data?.detalhes || "Email ou senha incorretos.";
      Alert.alert("Erro", msg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.titulo}>Acesse sua conta</Text>
        
        <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />

        <TouchableOpacity style={styles.botao} onPress={entrar} disabled={carregando}>
          {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botaoTexto}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('RecuperarSenha', { email: email.trim() })}>
          <Text style={styles.link}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.link}>Não tem conta? Cadastre-se.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  formContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', fontSize: 16, marginBottom: 15 },
  botao: { backgroundColor: '#006666', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  botaoTexto: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#006666', marginTop: 20, fontSize: 15, fontWeight: '500' }
});