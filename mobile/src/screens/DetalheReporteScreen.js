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
import { analisarReporteAdmin } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

const OPCOES_STATUS = [
  { rotulo: 'Pendente', valor: 'PENDENTE' },
  { rotulo: 'Procedente', valor: 'PROCEDENTE' },
  { rotulo: 'Improcedente', valor: 'IMPROCEDENTE' },
];

const ROTULO_TIPO = {
  HORARIO: 'Horário',
  PARADA: 'Parada',
  ITINERARIO: 'Itinerário',
};

// RF24 - Tela para o administrador classificar um reporte e registrar a correção realizada
export default function DetalheReporteScreen({ route, navigation }) {
  const { reporte } = route.params;

  const [status, setStatus] = useState(reporte.status || 'PENDENTE');
  const [observacaoAdmin, setObservacaoAdmin] = useState(reporte.observacaoAdmin || '');
  const [salvando, setSalvando] = useState(false);

  const salvarAnalise = async () => {
    const observacaoLimpa = observacaoAdmin.trim();

    if (status === 'PROCEDENTE' && !observacaoLimpa) {
      mostrarAviso(
        'Atenção',
        'Informe a correção realizada ao classificar o reporte como procedente.'
      );
      return;
    }

    setSalvando(true);
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      await analisarReporteAdmin(token, reporte.id, {
        status,
        observacaoAdmin: observacaoLimpa,
      });
      mostrarAviso('Análise salva', 'Classificação do reporte atualizada com sucesso.');
      navigation.goBack();
    } catch (error) {
      const msg = error?.response?.data?.detalhes || 'Não foi possível salvar a análise.';
      mostrarAviso('Erro', msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.blocoInfo}>
        <Text style={styles.tipo}>
          Tipo: {ROTULO_TIPO[reporte.tipo] || reporte.tipo}
        </Text>
        <Text style={styles.descricao}>{reporte.descricao}</Text>

        {reporte.linhaId ? (
          <Text style={styles.meta}>Linha relacionada: {reporte.linhaId}</Text>
        ) : null}
        {reporte.paradaId ? (
          <Text style={styles.meta}>Parada relacionada: {reporte.paradaId}</Text>
        ) : null}
        <Text style={styles.meta}>
          Passageiro: {reporte.usuarioNome || 'Anônimo'}
          {reporte.usuarioEmail ? ` (${reporte.usuarioEmail})` : ''}
        </Text>
      </View>

      <Text style={styles.label}>Classificação</Text>
      <View style={styles.opcoesStatus}>
        {OPCOES_STATUS.map((opcao) => {
          const selecionado = status === opcao.valor;
          return (
            <TouchableOpacity
              key={opcao.valor}
              style={[styles.opcaoBotao, selecionado && styles.opcaoSelecionada]}
              onPress={() => setStatus(opcao.valor)}
              disabled={salvando}
            >
              <Text style={[styles.opcaoTexto, selecionado && styles.opcaoTextoSelecionado]}>
                {opcao.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>
        {status === 'PROCEDENTE'
          ? 'Correção realizada (obrigatório)'
          : 'Observação do administrador (opcional)'}
      </Text>
      <TextInput
        style={styles.inputMultilinha}
        placeholder={
          status === 'PROCEDENTE'
            ? 'Descreva a correção aplicada nos dados...'
            : 'Adicione uma observação ou justificativa...'
        }
        value={observacaoAdmin}
        onChangeText={setObservacaoAdmin}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.botaoSalvar} onPress={salvarAnalise} disabled={salvando}>
        {salvando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.botaoSalvarTexto}>Salvar análise</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  conteudo: { padding: 20 },
  blocoInfo: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tipo: { fontSize: 16, fontWeight: 'bold', color: '#006666', marginBottom: 8 },
  descricao: { fontSize: 15, color: '#333', marginBottom: 12 },
  meta: { fontSize: 13, color: '#666', marginBottom: 4 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  opcoesStatus: { flexDirection: 'row', gap: 8, marginBottom: 20 },
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
  opcaoTexto: { color: '#333', fontSize: 13, fontWeight: '600' },
  opcaoTextoSelecionado: { color: '#FFF' },
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
  botaoSalvar: {
    backgroundColor: '#006666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  botaoSalvarTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
