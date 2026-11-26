import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getLinhas, excluirLinha, buscarParadasAdmin, obterParadaAdmin, excluirParada } from '../services/api';
import { mostrarAviso, confirmarAcao } from '../utils/dialogos';

const ABAS = [
  { rotulo: 'Linhas', valor: 'LINHAS' },
  { rotulo: 'Paradas', valor: 'PARADAS' }
];

export default function ManterLinhasParadasScreen({ navigation }) {
  const [aba, setAba] = useState('LINHAS');
  const [busca, setBusca] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregarLinhas = async () => {
    setCarregando(true);
    try {
      setLinhas(await getLinhas());
    } catch (error) {
      mostrarAviso('Erro', 'Não foi possível carregar as linhas.');
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarLinhas();
    }, [])
  );

  // Paradas: busca no servidor a partir de 2 letras (como no NovoAlerta), refeita ao voltar para a tela
  useFocusEffect(
    useCallback(() => {
      const texto = busca.trim();
      if (aba !== 'PARADAS' || texto.length < 2) {
        setParadas([]);
        return undefined;
      }
      let cancelado = false;
      const timer = setTimeout(async () => {
        try {
          const token = await AsyncStorage.getItem('@rotasdf_token');
          const resultado = await buscarParadasAdmin(token, texto);
          if (!cancelado) setParadas(resultado);
        } catch (error) {
          if (!cancelado) mostrarAviso('Erro', 'Não foi possível buscar as paradas.');
        }
      }, 400);
      return () => {
        cancelado = true;
        clearTimeout(timer);
      };
    }, [aba, busca])
  );

  const trocarAba = (valor) => {
    setAba(valor);
    setBusca('');
  };

  const texto = busca.trim().toLowerCase();
  const linhasEncontradas = texto
    ? linhas.filter(
        (l) => l.codigo.toLowerCase().includes(texto) || l.nome.toLowerCase().includes(texto)
      )
    : linhas;

  const confirmarExclusaoLinha = (linha) => {
    confirmarAcao(
      'Excluir linha',
      `A linha ${linha.codigo} será excluída junto com todas as viagens, horários e favoritos dela. Esta ação não pode ser desfeita.`,
      'Excluir',
      async () => {
        try {
          const token = await AsyncStorage.getItem('@rotasdf_token');
          await excluirLinha(token, linha.id);
          carregarLinhas();
        } catch (error) {
          mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível excluir a linha.');
        }
      }
    );
  };

  // A busca traz só id, código e nome; a edição precisa da parada completa
  const abrirParada = async (parada) => {
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      const completa = await obterParadaAdmin(token, parada.id);
      navigation.navigate('NovaParada', { parada: completa });
    } catch (error) {
      mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível abrir a parada.');
    }
  };

  const confirmarExclusaoParada = (parada) => {
    confirmarAcao(
      'Excluir parada',
      `A parada ${parada.nome} será excluída e sairá dos favoritos dos passageiros. Esta ação não pode ser desfeita.`,
      'Excluir',
      async () => {
        try {
          const token = await AsyncStorage.getItem('@rotasdf_token');
          await excluirParada(token, parada.id);
          setParadas((atuais) => atuais.filter((p) => p.id !== parada.id));
        } catch (error) {
          mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível excluir a parada.');
        }
      }
    );
  };

  const renderLinha = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.titulo}>
        {item.codigo} - {item.nome}
      </Text>
      {item.operadora ? <Text style={styles.detalhe}>{item.operadora}</Text> : null}
      <View style={styles.acoes}>
        <TouchableOpacity style={styles.botaoEditar} onPress={() => navigation.navigate('NovaLinha', { linha: item })}>
          <Text style={styles.botaoEditarTexto}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoExcluir} onPress={() => confirmarExclusaoLinha(item)}>
          <Text style={styles.botaoExcluirTexto}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderParada = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.titulo}>{item.nome}</Text>
      <Text style={styles.detalhe}>Código {item.codigo || item.id}</Text>
      <View style={styles.acoes}>
        <TouchableOpacity style={styles.botaoEditar} onPress={() => abrirParada(item)}>
          <Text style={styles.botaoEditarTexto}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoExcluir} onPress={() => confirmarExclusaoParada(item)}>
          <Text style={styles.botaoExcluirTexto}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const emLinhas = aba === 'LINHAS';
  let mensagemVazia = 'Nenhuma linha encontrada.';
  if (!emLinhas) {
    mensagemVazia = busca.trim().length < 2
      ? 'Digite ao menos 2 letras para buscar paradas.'
      : 'Nenhuma parada encontrada.';
  }

  return (
    <View style={styles.container}>
      <View style={styles.abas}>
        {ABAS.map((a) => (
          <TouchableOpacity
            key={a.valor}
            style={[styles.aba, aba === a.valor && styles.abaAtiva]}
            onPress={() => trocarAba(a.valor)}
          >
            <Text style={[styles.abaTexto, aba === a.valor && styles.abaTextoAtivo]}>{a.rotulo}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.botaoNovo}
        onPress={() => navigation.navigate(emLinhas ? 'NovaLinha' : 'NovaParada')}
      >
        <Text style={styles.botaoNovoTexto}>{emLinhas ? 'Nova linha' : 'Nova parada'}</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={busca}
        onChangeText={setBusca}
        placeholder={emLinhas ? 'Buscar linha por número ou nome' : 'Buscar parada por nome ou código (mín. 2 letras)'}
      />

      {emLinhas && carregando ? (
        <ActivityIndicator size="large" color="#006666" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          key={aba}
          data={emLinhas ? linhasEncontradas : paradas}
          keyExtractor={(item) => String(item.id)}
          renderItem={emLinhas ? renderLinha : renderParada}
          ListEmptyComponent={<Text style={styles.vazio}>{mensagemVazia}</Text>}
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  abas: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16 },
  aba: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', marginRight: 8 },
  abaAtiva: { backgroundColor: '#006666', borderColor: '#006666' },
  abaTexto: { color: '#333', fontSize: 14 },
  abaTextoAtivo: { color: '#FFF', fontWeight: 'bold' },
  botaoNovo: { backgroundColor: '#006666', borderRadius: 8, padding: 14, alignItems: 'center', margin: 16, marginBottom: 12 },
  botaoNovoTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  input: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', padding: 12, fontSize: 16, marginHorizontal: 16 },
  item: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  detalhe: { fontSize: 13, color: '#666', marginTop: 4 },
  acoes: { flexDirection: 'row', marginTop: 12 },
  botaoEditar: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#006666', padding: 10, alignItems: 'center', marginRight: 8 },
  botaoEditarTexto: { color: '#006666', fontWeight: 'bold' },
  botaoExcluir: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#C62828', padding: 10, alignItems: 'center' },
  botaoExcluirTexto: { color: '#C62828', fontWeight: 'bold' },
  vazio: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 16 },
});
