import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getHorarios } from '../services/api';

export default function HorariosScreen({ route, navigation }) {
  const { linhaId } = route?.params || { linhaId: 1 };
  const [dados, setDados] = useState(null);
  const [tipoDia, setTipoDia] = useState('DIA_UTIL'); 
  const [sentido, setSentido] = useState('IDA'); 
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarHorarios() {
      try {
        const res = await getHorarios(linhaId);
        setDados(res);
      } catch (err) {
        console.error("Erro ao carregar horários:", err);
      } finally {
        setCarregando(false);
      }
    }
    carregarHorarios();
  }, [linhaId]);

  const horariosAtuais = dados?.quadroHorarios?.[sentido]?.[tipoDia] || [];

  if (carregando) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#006666" />
        <Text>Carregando horários...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.numeroLinha}>{dados?.codigo || '---'}</Text>
        <Text style={styles.nomeLinha}>{dados?.nome || 'Linha'}</Text>
      </View>

      <TouchableOpacity
        style={styles.botaoItinerario}
        onPress={() => navigation.navigate('Itinerario', { linhaId })}
      >
        <Text style={styles.botaoItinerarioTexto}>Ver itinerário</Text>
      </TouchableOpacity>

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

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, tipoDia === 'DIA_UTIL' && styles.tabAtiva]} onPress={() => setTipoDia('DIA_UTIL')}>
          <Text style={styles.tabTexto}>Dias úteis</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tipoDia === 'SABADO' && styles.tabAtiva]} onPress={() => setTipoDia('SABADO')}>
          <Text style={styles.tabTexto}>Sábados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tipoDia === 'DOMINGO_FERIADO' && styles.tabAtiva]} onPress={() => setTipoDia('DOMINGO_FERIADO')}>
          <Text style={styles.tabTexto}>Dom/Fer.</Text>
        </TouchableOpacity>
      </View>

      {horariosAtuais.length === 0 ? (
        <Text style={styles.textoVazio}>Nenhum horário encontrado para esta seleção.</Text>
      ) : (
        <FlatList
          data={horariosAtuais}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3} 
          renderItem={({ item }) => (
            <View style={styles.horarioCard}>
              <Text style={styles.horarioTexto}>{item}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  containerCentered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 16, alignItems: 'center' },
  numeroLinha: { fontSize: 24, fontWeight: 'bold', color: '#006666' },
  nomeLinha: { fontSize: 16, color: '#666', textAlign: 'center' },
  botaoItinerario: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#006666', marginBottom: 16 },
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
  
  textoVazio: { textAlign: 'center', color: '#666', marginTop: 20, fontSize: 16 },
  
  horarioCard: { flex: 1, margin: 4, padding: 12, backgroundColor: '#FFF', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  horarioTexto: { fontSize: 16, fontWeight: 'bold', color: '#333' }
});