import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { criarParada, editarParada } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

const paraTexto = (valor) => (valor === null || valor === undefined ? '' : String(valor));

export default function NovaParadaScreen({ navigation, route }) {
  const paradaEdicao = route?.params?.parada;

  const [codigo, setCodigo] = useState(paraTexto(paradaEdicao?.codigo || paradaEdicao?.id));
  const [nome, setNome] = useState(paraTexto(paradaEdicao?.nome));
  const [latitude, setLatitude] = useState(paraTexto(paradaEdicao?.latitude));
  const [longitude, setLongitude] = useState(paraTexto(paradaEdicao?.longitude));
  const [tipo, setTipo] = useState(paraTexto(paradaEdicao?.tipo));
  const [estrutura, setEstrutura] = useState(paraTexto(paradaEdicao?.estrutura));
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: paradaEdicao ? 'Editar parada' : 'Nova parada' });
  }, [navigation, paradaEdicao]);

  const salvar = async () => {
    setSalvando(true);
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      const dados = { nome, latitude, longitude, tipo, estrutura };
      if (paradaEdicao) {
        await editarParada(token, paradaEdicao.id, dados);
      } else {
        await criarParada(token, { codigo, ...dados });
      }
      mostrarAviso('Pronto', paradaEdicao ? 'Parada atualizada.' : 'Parada criada.');
      navigation.goBack();
    } catch (error) {
      mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível salvar a parada.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Código</Text>
      <TextInput
        style={[styles.input, paradaEdicao && styles.inputBloqueado]}
        value={codigo}
        onChangeText={setCodigo}
        editable={!paradaEdicao}
        placeholder="Ex.: 3369"
      />
      {paradaEdicao && <Text style={styles.aviso}>O código identifica a parada e não pode ser alterado.</Text>}

      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Ex.: Rodoviária do Plano Piloto" />

      <Text style={styles.label}>Latitude</Text>
      <TextInput style={styles.input} value={latitude} onChangeText={setLatitude} placeholder="Ex.: -15.7942" />

      <Text style={styles.label}>Longitude</Text>
      <TextInput style={styles.input} value={longitude} onChangeText={setLongitude} placeholder="Ex.: -47.8822" />

      <Text style={styles.label}>Tipo</Text>
      <TextInput style={styles.input} value={tipo} onChangeText={setTipo} placeholder="Ex.: Placa" />

      <Text style={styles.label}>Estrutura</Text>
      <TextInput
        style={styles.input}
        value={estrutura}
        onChangeText={setEstrutura}
        placeholder="Ex.: ACOSTAMENTO OU BAIA"
      />

      <TouchableOpacity style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
        <Text style={styles.botaoSalvarTexto}>
          {salvando ? 'Salvando...' : paradaEdicao ? 'Salvar alterações' : 'Criar parada'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', padding: 12, fontSize: 16 },
  inputBloqueado: { backgroundColor: '#EEE', color: '#666' },
  aviso: { color: '#666', fontSize: 13, marginTop: 6 },
  botaoSalvar: { backgroundColor: '#006666', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 28 },
  botaoSalvarTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
