import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getItinerario,
  buscarParadasAdmin,
  incluirParadaNoItinerario,
  removerParadaDoItinerario
} from '../services/api';
import { mostrarAviso, confirmarAcao } from '../utils/dialogos';

const NOME_SENTIDO = { IDA: 'ida', VOLTA: 'volta' };

export default function ManterItinerarioScreen({ route }) {
  const { linha } = route.params;
  const [sentido, setSentido] = useState('IDA');
  const [itinerario, setItinerario] = useState({ IDA: [], VOLTA: [] });
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [encontradas, setEncontradas] = useState([]);
  const [escolhida, setEscolhida] = useState(null);

  // Usa a mesma consulta de itinerário do passageiro
  const carregar = async () => {
    setCarregando(true);
    try {
      const dados = await getItinerario(linha.id);
      setItinerario(dados.itinerario);
    } catch (error) {
      setItinerario({ IDA: [], VOLTA: [] });
      if (error?.response?.status !== 404) {
        mostrarAviso('Erro', 'Não foi possível carregar o itinerário.');
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  // Busca da parada a incluir, como no NovoAlerta (a partir de 2 letras)
  useEffect(() => {
    const texto = busca.trim();
    if (texto.length < 2) {
      setEncontradas([]);
      return undefined;
    }
    let cancelado = false;
    const timer = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('@rotasdf_token');
        const resultado = await buscarParadasAdmin(token, texto);
        if (!cancelado) setEncontradas(resultado);
      } catch (error) {
        // sem resultado
      }
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [busca]);

  const escolher = (parada) => {
    setEscolhida(parada);
    setBusca('');
    setEncontradas([]);
  };

  // depoisDaSequencia = 0 coloca a parada no início
  const incluir = async (depoisDaSequencia) => {
    if (!escolhida) {
      mostrarAviso('Atenção', 'Busque e escolha a parada que vai entrar no itinerário.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('@rotasdf_token');
      await incluirParadaNoItinerario(token, linha.id, { sentido, paradaId: escolhida.id, depoisDaSequencia });
      mostrarAviso('Pronto', 'Parada incluída no itinerário.');
      setEscolhida(null);
      carregar();
    } catch (error) {
      mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível incluir a parada.');
    }
  };

  const confirmarRemocao = (parada) => {
    confirmarAcao(
      'Remover parada',
      `A parada ${parada.nome} sairá do itinerário de ${NOME_SENTIDO[sentido]} em todas as viagens. Os horários das outras paradas não mudam.`,
      'Remover',
      async () => {
        try {
          const token = await AsyncStorage.getItem('@rotasdf_token');
          await removerParadaDoItinerario(token, linha.id, sentido, parada.sequencia);
          carregar();
        } catch (error) {
          mostrarAviso('Erro', error?.response?.data?.detalhes || 'Não foi possível remover a parada.');
        }
      }
    );
  };

  const paradas = itinerario?.[sentido] || [];

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.paradaTexto}>
        {item.sequencia}. {item.nome}
      </Text>
      <View style={styles.acoes}>
        <TouchableOpacity style={styles.botaoIncluir} onPress={() => incluir(item.sequencia)}>
          <Text style={styles.botaoIncluirTexto}>Incluir depois</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoRemover} onPress={() => confirmarRemocao(item)}>
          <Text style={styles.botaoRemoverTexto}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.numeroLinha}>{linha.codigo}</Text>
        <Text style={styles.nomeLinha}>{linha.nome}</Text>
      </View>

      <View style={styles.sentidoContainer}>
        {['IDA', 'VOLTA'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.botaoSentido, sentido === s && styles.botaoSentidoAtivo]}
            onPress={() => setSentido(s)}
          >
            <Text style={[styles.textoSentido, sentido === s && styles.textoSentidoAtivo]}>
              {s === 'IDA' ? 'Ida' : 'Volta'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Parada a incluir</Text>
      {escolhida ? (
        <View style={styles.escolhida}>
          <Text style={styles.escolhidaTexto}>
            {escolhida.nome} (código {escolhida.codigo || escolhida.id})
          </Text>
          <TouchableOpacity onPress={() => setEscolhida(null)}>
            <Text style={styles.trocar}>Trocar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar parada por nome ou código (mín. 2 letras)"
          />
          {encontradas.map((parada) => (
            <TouchableOpacity key={parada.id} style={styles.resultado} onPress={() => escolher(parada)}>
              <Text style={styles.resultadoTexto}>
                {parada.nome} (código {parada.codigo || parada.id})
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}
      <Text style={styles.dica}>Escolha a parada e toque em "Incluir depois" na posição em que ela deve entrar.</Text>
      <TouchableOpacity style={styles.botaoInicio} onPress={() => incluir(0)}>
        <Text style={styles.botaoInicioTexto}>Incluir no início</Text>
      </TouchableOpacity>

      {carregando ? (
        <ActivityIndicator size="large" color="#006666" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={paradas}
          keyExtractor={(item) => String(item.sequencia)}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.textoVazio}>Nenhuma parada neste sentido.</Text>}
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

  sentidoContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16, backgroundColor: '#E0E0E0', borderRadius: 8, alignSelf: 'center' },
  botaoSentido: { paddingVertical: 8, paddingHorizontal: 32, borderRadius: 8 },
  botaoSentidoAtivo: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  textoSentido: { color: '#666', fontWeight: 'bold' },
  textoSentidoAtivo: { color: '#006666' },

  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', padding: 12, fontSize: 16 },
  resultado: { backgroundColor: '#FFF', padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  resultadoTexto: { color: '#333', fontSize: 14 },
  escolhida: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#006666', padding: 12 },
  escolhidaTexto: { flex: 1, color: '#333', fontSize: 15, fontWeight: 'bold' },
  trocar: { color: '#006666', fontWeight: 'bold', marginLeft: 12 },
  dica: { color: '#666', fontSize: 13, marginTop: 8 },
  botaoInicio: { borderRadius: 8, borderWidth: 1, borderColor: '#006666', padding: 10, alignItems: 'center', marginTop: 12 },
  botaoInicioTexto: { color: '#006666', fontWeight: 'bold' },

  item: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#EEE' },
  paradaTexto: { fontSize: 15, color: '#333' },
  acoes: { flexDirection: 'row', marginTop: 8 },
  botaoIncluir: { borderRadius: 8, borderWidth: 1, borderColor: '#006666', paddingVertical: 6, paddingHorizontal: 12, marginRight: 8 },
  botaoIncluirTexto: { color: '#006666', fontWeight: 'bold' },
  botaoRemover: { borderRadius: 8, borderWidth: 1, borderColor: '#C62828', paddingVertical: 6, paddingHorizontal: 12 },
  botaoRemoverTexto: { color: '#C62828', fontWeight: 'bold' },
  textoVazio: { textAlign: 'center', color: '#666', marginTop: 20, fontSize: 16 },
});
