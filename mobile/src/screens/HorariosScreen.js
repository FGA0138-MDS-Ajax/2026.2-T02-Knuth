import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { getHorarios } from '../services/api';

export default function HorariosScreen({ route }) {
  const { linhaId } = route?.params || { linhaId: 1 };
  const [dados, setDados] = useState(null);
  const [tipoDia, setTipoDia] = useState('DIA_UTIL'); // DIA_UTIL, SABADO, DOMINGO_FERIADO

  useEffect(() => {
    async function carregarHorarios() {
      try {
        const res = await getHorarios(linhaId);
        setDados(res);
      } catch (err) {
        console.error("Erro ao carregar horários:", err);
      }
    }
    carregarHorarios();
  }, [linhaId]);

  const horariosAtuais = dados?.quadroHorarios?.IDA?.[tipoDia] || [];

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.numeroLinha}>{dados?.codigo || '---'}</Text>
        <Text style={styles.nomeLinha}>{dados?.nome || 'Carregando...'}</Text>
      </View>

      {/* Seletores de Tipo de Dia */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, tipoDia === 'DIA_UTIL' && styles.tabAtiva]}
          onPress={() => setTipoDia('DIA_UTIL')}>
          <Text style={styles.tabTexto}>Dias úteis</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, tipoDia === 'SABADO' && styles.tabAtiva]}
          onPress={() => setTipoDia('SABADO')}>
          <Text style={styles.tabTexto}>Sábados</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, tipoDia === 'DOMINGO_FERIADO' && styles.tabAtiva]}
          onPress={() => setTipoDia('DOMINGO_FERIADO')}>
          <Text style={styles.tabTexto}>Domingos/Feriados</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Horários */}
      <FlatList
        data={horariosAtuais}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.horarioCard}>
            <Text style={styles.horarioTexto}>{item}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  header: { marginBottom: 16, alignItems: 'center' },
  numeroLinha: { fontSize: 24, fontWeight: 'bold', color: '#006666' },
  nomeLinha: { fontSize: 16, color: '#666' },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#E0E0E0' },
  tabAtiva: { backgroundColor: '#006666' },
  tabTexto: { color: '#FFF', fontWeight: 'bold' },
  horarioCard: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  horarioTexto: { fontSize: 18, fontWeight: '500' }
});