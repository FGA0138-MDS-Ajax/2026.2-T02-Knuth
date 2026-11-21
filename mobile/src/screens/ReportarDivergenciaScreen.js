import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportarDivergencia } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

const OPCOES_TIPO = [
  { rotulo: 'Horário', valor: 'HORARIO' },
  { rotulo: 'Parada', valor: 'PARADA' },
  { rotulo: 'Itinerário', valor: 'ITINERARIO' },
];

const TAMANHO_MINIMO_DESCRICAO = 10;

// RF19 - Tela para o passageiro reportar divergências de horário, parada ou itinerário
export default function ReportarDivergenciaScreen({ route, navigation }) {
  const params = route?.params || {};

  const [tipo, setTipo] = useState(params.tipo || 'HORARIO');
  const [linhaId, setLinhaId] = useState(params.linhaId ? String(params.linhaId) : '');
  const [paradaId, setParadaId] = useState(params.paradaId ? String(params.paradaId) : '');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    const linhaLimpa = linhaId.trim();
    const paradaLimpa = paradaId.trim();
    const descricaoLimpa = descricao.trim();

    if (!linhaLimpa && !paradaLimpa) {
      mostrarAviso('Atenção', 'Informe ao menos a linha ou a parada relacionada à divergência.');
      return;
    }

    if (descricaoLimpa.length < TAMANHO_MINIMO_DESCRICAO) {
      mostrarAviso(
        'Atenção',
        `A descrição da divergência deve ter pelo menos ${TAMANHO_MINIMO_DESCRICAO} caracteres.`
      );
      return;
    }

    setEnviando(true);
    try {
      let usuarioId = null;
      const usuarioSalvo = await AsyncStorage.getItem('@rotasdf_usuario');
      if (usuarioSalvo) {
        const parsed = JSON.parse(usuarioSalvo);
        if (parsed?.id !== undefined && parsed?.id !== null) {
          usuarioId = parsed.id;
        }
      }

      await reportarDivergencia({
        tipo,
        descricao: descricaoLimpa,
        linhaId: linhaLimpa || null,
        paradaId: paradaLimpa || null,
        usuarioId,
      });

      mostrarAviso(
        'Reporte enviado',
        'Obrigado! Sua informação será analisada pela nossa equipe.'
      );
      navigation.goBack();
    } catch (error) {
      const msg =
        error?.response?.data?.detalhes ||
        error?.response?.data?.erro ||
        'Não foi possível enviar o reporte. Tente novamente.';
      mostrarAviso('Erro', msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Reportar divergência</Text>
      <Text style={styles.subtitulo}>
        Encontrou um horário, parada ou itinerário incorreto? Avise nossa equipe para atualizarmos
        os dados.
      </Text>

      <Text style={styles.label}>Tipo de divergência</Text>
      <View style={styles.opcoesTipo}>
        {OPCOES_TIPO.map((opcao) => {
          const selecionado = tipo === opcao.valor;
          return (
            <TouchableOpacity
              key={opcao.valor}
              style={[styles.opcaoBotao, selecionado && styles.opcaoSelecionada]}
              onPress={() => setTipo(opcao.valor)}
              disabled={enviando}
            >
              <Text style={[styles.opcaoTexto, selecionado && styles.opcaoTextoSelecionado]}>
                {opcao.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Linha relacionada</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: 0.110"
        value={linhaId}
        onChangeText={setLinhaId}
      />

      <Text style={styles.label}>Parada relacionada</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: P-101 ou nome da parada"
        value={paradaId}
        onChangeText={setParadaId}
      />

      <Text style={styles.label}>Descrição da divergência</Text>
      <TextInput
        style={styles.inputMultilinha}
        placeholder="Descreva o problema encontrado (mínimo 10 caracteres)..."
        value={descricao}
        onChangeText={setDescricao}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.botaoEnviar} onPress={enviar} disabled={enviando}>
        {enviando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.botaoEnviarTexto}>Enviar reporte</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  conteudo: { padding: 20 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  opcoesTipo: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  opcaoBotao: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  opcaoSelecionada: { backgroundColor: '#006666', borderColor: '#006666' },
  opcaoTexto: { color: '#333', fontSize: 14, fontWeight: '600' },
  opcaoTextoSelecionado: { color: '#FFF' },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  inputMultilinha: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 14,
    fontSize: 15,
    minHeight: 110,
    marginBottom: 20,
  },
  botaoEnviar: {
    backgroundColor: '#006666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  botaoEnviarTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
