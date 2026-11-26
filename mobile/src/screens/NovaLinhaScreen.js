import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { criarLinha, editarLinha } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

const paraTexto = (valor) => (valor === null || valor === undefined ? '' : String(valor));

export default function NovaLinhaScreen({ navigation, route }) {
  const linhaEdicao = route?.params?.linha;

  const [codigo, setCodigo] = useState(paraTexto(linhaEdicao?.codigo));
  const [nome, setNome] = useState(paraTexto(linhaEdicao?.nome));
  const [cor, setCor] = useState(paraTexto(linhaEdicao?.cor));
  const [tarifa, setTarifa] = useState(paraTexto(linhaEdicao?.tarifa));
  const [faixaTarifaria, setFaixaTarifaria] = useState(paraTexto(linhaEdicao?.faixa_tarifaria));
  const [operadora, setOperadora] = useState(paraTexto(linhaEdicao?.operadora));
  const [extensao, setExtensao] = useState(paraTexto(linhaEdicao?.extensao_km));
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: linhaEdicao ? 'Editar linha' : 'Nova linha' });
  }, [navigation, linhaEdicao]);

  const salvar = async () => {
    setSalvando(true);
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      const dados = {
        nome,
        cor,
        tarifa,
        faixa_tarifaria: faixaTarifaria,
        operadora,
        extensao_km: extensao
      };
      if (linhaEdicao) {
        await editarLinha(token, linhaEdicao.id, dados);
      } else {
        await criarLinha(token, { codigo, ...dados });
      }
      mostrarAviso('Pronto', linhaEdicao ? 'Linha atualizada.' : 'Linha criada.');
      navigation.goBack();
    } catch (error) {
      mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível salvar a linha.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Código</Text>
      <TextInput
        style={[styles.input, linhaEdicao && styles.inputBloqueado]}
        value={codigo}
        onChangeText={setCodigo}
        editable={!linhaEdicao}
        placeholder="Ex.: 0.110"
      />
      {linhaEdicao && <Text style={styles.aviso}>O código identifica a linha e não pode ser alterado.</Text>}

      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={setNome}
        placeholder="Ex.: Rodoviária do Plano Piloto/W3 Sul"
      />

      <Text style={styles.label}>Cor (#RRGGBB)</Text>
      <TextInput style={styles.input} value={cor} onChangeText={setCor} placeholder="Ex.: #006666" />

      <Text style={styles.label}>Tarifa (R$)</Text>
      <TextInput
        style={styles.input}
        value={tarifa}
        onChangeText={setTarifa}
        keyboardType="decimal-pad"
        placeholder="Ex.: 5,50"
      />

      <Text style={styles.label}>Faixa tarifária</Text>
      <TextInput
        style={styles.input}
        value={faixaTarifaria}
        onChangeText={setFaixaTarifaria}
        placeholder="Ex.: METROPOLITANA 1"
      />

      <Text style={styles.label}>Operadora</Text>
      <TextInput style={styles.input} value={operadora} onChangeText={setOperadora} placeholder="Ex.: Urbi · Bacia 03" />

      <Text style={styles.label}>Extensão (km)</Text>
      <TextInput
        style={styles.input}
        value={extensao}
        onChangeText={setExtensao}
        keyboardType="decimal-pad"
        placeholder="Ex.: 28,5"
      />

      <TouchableOpacity style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
        <Text style={styles.botaoSalvarTexto}>
          {salvando ? 'Salvando...' : linhaEdicao ? 'Salvar alterações' : 'Criar linha'}
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
