import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { getTrajetos, getParadaProxima } from '../services/api';

export default function BuscarTrajetoScreen({ navigation }) {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [erro, setErro] = useState('');

  const usarLocalizacaoAtual = async () => {
    setBuscandoGps(true);
    setErro('');
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErro("Permissão negada para acessar o GPS.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const parada = await getParadaProxima(latitude, longitude);

      if (parada && parada.nome) {
        setOrigem(parada.nome);
      } else {
        setErro("Nenhuma parada encontrada próxima a você.");
      }
    } catch (error) {
      console.error(error);
      setErro("Erro ao buscar localização. Verifique se o GPS está ligado.");
    } finally {
      setBuscandoGps(false);
    }
  };

  const buscar = async () => {
    setErro('');
    if (!origem.trim() || !destino.trim()) {
      setErro("Por favor, preencha a origem e o destino.");
      return;
    }

    setCarregando(true);
    try {
      const opcoes = await getTrajetos(origem, destino);
      if (!opcoes || opcoes.length === 0) {
        setErro("Nenhuma rota direta encontrada para esses locais.");
      } else {
        navigation.navigate('ResultadoTrajeto', { opcoes });
      }
    } catch (error) {
      console.error(error);
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Planejar Viagem</Text>

      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Origem:</Text>
          <TouchableOpacity onPress={usarLocalizacaoAtual} disabled={buscandoGps}>
            <Text style={styles.botaoGps}>
              {buscandoGps ? "Buscando..." : "📍 Usar minha localização"}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Ex: Terminal do Gama"
          value={origem}
          onChangeText={setOrigem}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Destino:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Rodoviária do Plano Piloto"
          value={destino}
          onChangeText={setDestino}
        />
      </View>

      {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}

      <TouchableOpacity style={styles.botao} onPress={buscar} disabled={carregando}>
        {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botaoTexto}>Buscar Trajetos</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20, justifyContent: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#006666', marginBottom: 30, textAlign: 'center' },
  inputContainer: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 16, color: '#333', fontWeight: '600' },
  botaoGps: { fontSize: 14, color: '#006666', fontWeight: 'bold' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', fontSize: 16 },
  textoErro: { color: 'red', textAlign: 'center', marginBottom: 15, fontSize: 15 },
  botao: { backgroundColor: '#006666', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  botaoTexto: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});