import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listarPartidasAdmin, incluirPartida, alterarPartida, excluirPartida } from '../services/api';
import { mostrarAviso, confirmarAcao } from '../utils/dialogos';

const TIPOS_DIA = [
  { rotulo: 'Dias úteis', valor: 'DIA_UTIL' },
  { rotulo: 'Sábados', valor: 'SABADO' },
  { rotulo: 'Dom/Fer.', valor: 'DOMINGO_FERIADO' }
];

export default function ManterHorariosScreen({ route, navigation }) {
  const { linha } = route.params;
  const [sentido, setSentido] = useState('IDA');
  const [tipoDia, setTipoDia] = useState('DIA_UTIL');
  const [partidas, setPartidas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [horario, setHorario] = useState('');
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      setPartidas(await listarPartidasAdmin(token, linha.id, sentido, tipoDia));
    } catch (error) {
      setPartidas([]);
      mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível carregar as partidas.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [sentido, tipoDia]);

  const cancelarEdicao = () => {
    setEditando(null);
    setHorario('');
  };

  const comecarEdicao = (partida) => {
    setEditando(partida);
    setHorario(partida.horario);
  };

  // Incluir copia a viagem mais próxima do mesmo sentido e tipo de dia; alterar desloca todos os horários da viagem
  const salvar = async () => {
    setSalvando(true);
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      if (editando) {
        await alterarPartida(token, linha.id, editando.viagemId, { horario });
      } else {
        await incluirPartida(token, linha.id, { sentido, tipoDia, horario });
      }
      mostrarAviso('Pronto', editando ? 'Partida alterada.' : 'Partida incluída.');
      cancelarEdicao();
      carregar();
    } catch (error) {
      mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível salvar a partida.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = (partida) => {
    confirmarAcao(
      'Excluir partida',
      `A partida das ${partida.horario} será excluída com todos os horários dessa viagem.`,
      'Excluir',
      async () => {
        try {
          const token = await AsyncStorage.getItem('@rotasdf_token');
          await excluirPartida(token, linha.id, partida.viagemId);
          cancelarEdicao();
          carregar();
        } catch (error) {
          mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível excluir a partida.');
        }
      }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.horarioTexto}>{item.horario}</Text>
      <TouchableOpacity style={styles.botaoAlterar} onPress={() => comecarEdicao(item)}>
        <Text style={styles.botaoAlterarTexto}>Alterar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.botaoExcluir} onPress={() => confirmarExclusao(item)}>
        <Text style={styles.botaoExcluirTexto}>Excluir</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.numeroLinha}>{linha.codigo}</Text>
        <Text style={styles.nomeLinha}>{linha.nome}</Text>
      </View>

      <TouchableOpacity
        style={styles.botaoItinerario}
        onPress={() => navigation.navigate('ManterItinerario', { linha })}
      >
        <Text style={styles.botaoItinerarioTexto}>Editar itinerário</Text>
      </TouchableOpacity>

      <View style={styles.sentidoContainer}>
        {['IDA', 'VOLTA'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.botaoSentido, sentido === s && styles.botaoSentidoAtivo]}
            onPress={() => {
              setSentido(s);
              cancelarEdicao();
            }}
          >
            <Text style={[styles.textoSentido, sentido === s && styles.textoSentidoAtivo]}>
              {s === 'IDA' ? 'Ida' : 'Volta'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabContainer}>
        {TIPOS_DIA.map((t) => (
          <TouchableOpacity
            key={t.valor}
            style={[styles.tab, tipoDia === t.valor && styles.tabAtiva]}
            onPress={() => {
              setTipoDia(t.valor);
              cancelarEdicao();
            }}
          >
            <Text style={styles.tabTexto}>{t.rotulo}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>
        {editando ? `Novo horário para a partida das ${editando.horario}` : 'Nova partida (HH:MM)'}
      </Text>
      <TextInput style={styles.input} value={horario} onChangeText={setHorario} placeholder="Ex.: 05:30" />
      <TouchableOpacity style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
        <Text style={styles.botaoSalvarTexto}>
          {salvando ? 'Salvando...' : editando ? 'Salvar alteração' : 'Incluir partida'}
        </Text>
      </TouchableOpacity>
      {editando && (
        <TouchableOpacity onPress={cancelarEdicao}>
          <Text style={styles.cancelar}>Cancelar alteração</Text>
        </TouchableOpacity>
      )}

      {carregando ? (
        <ActivityIndicator size="large" color="#006666" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={partidas}
          keyExtractor={(item) => item.viagemId}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.textoVazio}>Nenhuma partida neste sentido e tipo de dia.</Text>}
          contentContainerStyle={{ paddingTop: 12 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  header: { marginBottom: 16, alignItems: 'center' },
  numeroLinha: { fontSize: 24, fontWeight: 'bold', color: '#006666' },
  nomeLinha: { fontSize: 16, color: '#666', textAlign: 'center' },
  botaoItinerario: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#006666', alignSelf: 'center', marginBottom: 16 },
  botaoItinerarioTexto: { color: '#006666', fontWeight: 'bold' },

  sentidoContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16, backgroundColor: '#E0E0E0', borderRadius: 8, alignSelf: 'center' },
  botaoSentido: { paddingVertical: 8, paddingHorizontal: 32, borderRadius: 8 },
  botaoSentidoAtivo: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  textoSentido: { color: '#666', fontWeight: 'bold' },
  textoSentidoAtivo: { color: '#006666' },

  tabContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#E0E0E0' },
  tabAtiva: { backgroundColor: '#006666' },
  tabTexto: { color: '#FFF', fontWeight: 'bold' },

  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', padding: 12, fontSize: 16 },
  botaoSalvar: { backgroundColor: '#006666', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  botaoSalvarTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelar: { color: '#666', textAlign: 'center', marginTop: 12, fontSize: 14 },

  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#EEE' },
  horarioTexto: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#333' },
  botaoAlterar: { borderRadius: 8, borderWidth: 1, borderColor: '#006666', paddingVertical: 6, paddingHorizontal: 12, marginRight: 8 },
  botaoAlterarTexto: { color: '#006666', fontWeight: 'bold' },
  botaoExcluir: { borderRadius: 8, borderWidth: 1, borderColor: '#C62828', paddingVertical: 6, paddingHorizontal: 12 },
  botaoExcluirTexto: { color: '#C62828', fontWeight: 'bold' },
  textoVazio: { textAlign: 'center', color: '#666', marginTop: 20, fontSize: 16 },
});
