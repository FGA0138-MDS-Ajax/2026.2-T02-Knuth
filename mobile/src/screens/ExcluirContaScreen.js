import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { excluirMinhaConta } from '../services/api';
import { mostrarAviso, confirmarAcao } from '../utils/dialogos';

const CHAVES_SESSAO = ['@rotasdf_token', '@rotasdf_usuario', '@rotasdf_buscas_recentes'];

// RF16 - Exclusão da própria conta pelo passageiro, com confirmação de senha.
export default function ExcluirContaScreen({ navigation }) {
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const excluir = async () => {
    setCarregando(true);
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      if (!token) {
        mostrarAviso('Sessão expirada', 'Entre novamente na sua conta para excluí-la.');
        navigation.navigate('Login');
        return;
      }

      await excluirMinhaConta(token, senha);
      for (const chave of CHAVES_SESSAO) {
        await AsyncStorage.removeItem(chave);
      }

      mostrarAviso('Conta excluída', 'Sua conta foi excluída com sucesso.');
      navigation.navigate('Linhas');
    } catch (error) {
      const msg = error.response?.data?.detalhes || 'Não foi possível excluir a conta. Tente novamente.';
      mostrarAviso('Erro', msg);
    } finally {
      setCarregando(false);
    }
  };

  const solicitarExclusao = () => {
    if (!senha) {
      mostrarAviso('Atenção', 'Informe sua senha para confirmar.');
      return;
    }

    confirmarAcao(
      'Excluir conta',
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
      'Excluir',
      excluir
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Excluir minha conta</Text>
      <Text style={styles.aviso}>
        Esta ação é permanente. Seus dados de cadastro e seu histórico de buscas serão apagados e não
        poderão ser recuperados.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Senha atual"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity style={styles.botaoExcluir} onPress={solicitarExclusao} disabled={carregando}>
        {carregando
          ? <ActivityIndicator color="#FFF" />
          : <Text style={styles.botaoExcluirTexto}>Excluir conta definitivamente</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} disabled={carregando}>
        <Text style={styles.link}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 24, justifyContent: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  aviso: { fontSize: 15, color: '#C62828', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', fontSize: 16, marginBottom: 15 },
  botaoExcluir: { backgroundColor: '#C62828', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  botaoExcluirTexto: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#006666', marginTop: 20, fontSize: 15, fontWeight: '500' }
});
