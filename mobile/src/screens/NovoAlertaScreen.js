import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { criarAlerta, getLinhas } from '../services/api';

const TIPOS = [
  { rotulo: 'Desvio', valor: 'DESVIO' },
  { rotulo: 'Suspensão', valor: 'SUSPENSAO' },
  { rotulo: 'Alteração de horário', valor: 'ALTERACAO_HORARIO' },
  { rotulo: 'Paralisação', valor: 'PARALISACAO' }
];

const doisDigitos = (n) => String(n).padStart(2, '0');

const dataParaTexto = (d) =>
  `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()} ${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;

// Converte "DD/MM/AAAA HH:MM" em Date (horário local). Retorna null se inválido.
const textoParaData = (texto) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  const [, dia, mes, ano, hora, minuto] = m.map(Number);
  const data = new Date(ano, mes - 1, dia, hora, minuto);
  if (data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
  return data;
};

export default function NovoAlertaScreen({ navigation }) {
  const agora = new Date();
  const amanha = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

  const [tipo, setTipo] = useState('DESVIO');
  const [descricao, setDescricao] = useState('');
  const [inicio, setInicio] = useState(dataParaTexto(agora));
  const [fim, setFim] = useState(dataParaTexto(amanha));
  const [todasLinhas, setTodasLinhas] = useState([]);
  const [busca, setBusca] = useState('');
  const [selecionadas, setSelecionadas] = useState([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    getLinhas()
      .then(setTodasLinhas)
      .catch(() => {});
  }, []);

  const resultados = busca.trim()
    ? todasLinhas
        .filter(
          (l) =>
            !selecionadas.includes(l.id) &&
            (l.codigo.toLowerCase().includes(busca.toLowerCase()) ||
              l.nome.toLowerCase().includes(busca.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  const adicionarLinha = (linha) => {
    setSelecionadas([...selecionadas, linha.id]);
    setBusca('');
  };

  const removerLinha = (id) => setSelecionadas(selecionadas.filter((s) => s !== id));

  const salvar = async () => {
    const dataInicio = textoParaData(inicio);
    const dataFim = textoParaData(fim);
    if (!dataInicio || !dataFim) {
      Alert.alert('Atenção', 'Use as datas no formato DD/MM/AAAA HH:MM.');
      return;
    }

    setSalvando(true);
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      await criarAlerta(token, {
        tipo,
        titulo: descricao.trim().slice(0, 60),
        descricao,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        linhas: selecionadas
      });
      Alert.alert('Pronto', 'Alerta criado.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error?.response?.data?.detalhes || 'Não foi possível criar o alerta.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Tipo</Text>
      <View style={styles.chips}>
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t.valor}
            style={[styles.chip, tipo === t.valor && styles.chipAtivo]}
            onPress={() => setTipo(t.valor)}
          >
            <Text style={[styles.chipTexto, tipo === t.valor && styles.chipTextoAtivo]}>{t.rotulo}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        value={descricao}
        onChangeText={setDescricao}
        multiline
        placeholder="O que os passageiros precisam saber?"
      />

      <Text style={styles.label}>Início (DD/MM/AAAA HH:MM)</Text>
      <TextInput style={styles.input} value={inicio} onChangeText={setInicio} />

      <Text style={styles.label}>Fim (DD/MM/AAAA HH:MM)</Text>
      <TextInput style={styles.input} value={fim} onChangeText={setFim} />

      <Text style={styles.label}>Linhas afetadas</Text>
      <View style={styles.chips}>
        {selecionadas.map((id) => (
          <TouchableOpacity key={id} style={[styles.chip, styles.chipAtivo]} onPress={() => removerLinha(id)}>
            <Text style={styles.chipTextoAtivo}>{id}  ✕</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar linha por número ou nome"
      />
      {resultados.map((linha) => (
        <TouchableOpacity key={linha.id} style={styles.resultado} onPress={() => adicionarLinha(linha)}>
          <Text style={styles.resultadoTexto}>
            {linha.codigo} - {linha.nome}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
        <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Criar alerta'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', padding: 12, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', marginRight: 8, marginBottom: 8 },
  chipAtivo: { backgroundColor: '#006666', borderColor: '#006666' },
  chipTexto: { color: '#333', fontSize: 14 },
  chipTextoAtivo: { color: '#FFF', fontWeight: 'bold' },
  resultado: { backgroundColor: '#FFF', padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  resultadoTexto: { color: '#333', fontSize: 14 },
  botaoSalvar: { backgroundColor: '#006666', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 28 },
  botaoSalvarTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});