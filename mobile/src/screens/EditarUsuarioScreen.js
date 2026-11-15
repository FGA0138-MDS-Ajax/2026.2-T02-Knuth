import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { atualizarUsuario, excluirUsuario } from '../services/api';

export default function EditarUsuarioScreen({ route, navigation }) {
  const { usuario, ehVoce } = route.params;

  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState(usuario.tipo);
  const [salvando, setSalvando] = useState(false);

  const mensagemDeErro = (error) =>
    error?.response?.data?.detalhes || 'Não foi possível completar a ação.';

  const salvar = async () => {
    setSalvando(true);
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      const dados = { nome, email, tipo };
      if (senha) dados.senha = senha;
      await atualizarUsuario(token, usuario.id, dados);
      Alert.alert('Pronto', 'Usuário atualizado.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', mensagemDeErro(error));
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = () => {
    Alert.alert('Excluir usuário', `Tem certeza que deseja excluir ${usuario.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('@rotasdf_token');
            await excluirUsuario(token, usuario.id);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Erro', mensagemDeErro(error));
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} />

      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Nova senha (opcional)</Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        placeholder="Deixe em branco para não alterar"
      />

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.tipos}>
        {['PASSAGEIRO', 'ADMIN'].map((t) => (
          <TouchableOpacity
            key={t}
            disabled={ehVoce}
            style={[styles.tipo, tipo === t && styles.tipoAtivo, ehVoce && { opacity: 0.5 }]}
            onPress={() => setTipo(t)}
          >
            <Text style={[styles.tipoTexto, tipo === t && styles.tipoTextoAtivo]}>
              {t === 'ADMIN' ? 'Administrador' : 'Passageiro'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {ehVoce && <Text style={styles.aviso}>Esta é a sua conta: você não pode alterar seu tipo nem excluí-la.</Text>}

      <TouchableOpacity style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
        <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Salvar alterações'}</Text>
      </TouchableOpacity>

      {!ehVoce && (
        <TouchableOpacity style={styles.botaoExcluir} onPress={confirmarExclusao}>
          <Text style={styles.botaoExcluirTexto}>Excluir usuário</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', padding: 12, fontSize: 16 },
  tipos: { flexDirection: 'row' },
  tipo: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', marginRight: 8 },
  tipoAtivo: { backgroundColor: '#006666', borderColor: '#006666' },
  tipoTexto: { color: '#333', fontSize: 14 },
  tipoTextoAtivo: { color: '#FFF', fontWeight: 'bold' },
  aviso: { color: '#666', fontSize: 13, marginTop: 10 },
  botaoSalvar: { backgroundColor: '#006666', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  botaoSalvarTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  botaoExcluir: { borderRadius: 8, borderWidth: 1, borderColor: '#C62828', padding: 14, alignItems: 'center', marginTop: 12 },
  botaoExcluirTexto: { color: '#C62828', fontSize: 16, fontWeight: 'bold' }
});
