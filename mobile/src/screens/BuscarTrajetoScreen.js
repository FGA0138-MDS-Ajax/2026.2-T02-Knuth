import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { getTrajetos, getParadaProxima } from '../services/api';
import { salvarBuscaRecente } from '../services/storage';
import BuscasRecentes from '../components/BuscasRecentes';

export default function BuscarTrajetoScreen({ navigation }) {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [buscandoGps, setBuscandoGps] = useState(true);
  const [erro, setErro] = useState('');
  const [buscaSelecionada, setBuscaSelecionada] = useState(null);

  useEffect(() => {
    buscarLocalizacao();
  }, []);

  useEffect(() => {
    if (buscaSelecionada) {
      setBuscaSelecionada(null);
      buscar();
    }
  }, [buscaSelecionada]);

  const buscarLocalizacao = async () => {
    setBuscandoGps(true);
    setErro('');
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErro("Permissão negada. Ative o GPS para usar o planejador.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      
      const parada = await getParadaProxima(latitude, longitude);

      if (parada && parada.nome) {
        setOrigem(parada.nome);
      } else {
        setErro("Nenhuma parada encontrada próxima à sua localização.");
      }
    } catch (error) {
      console.error(error);
      setErro("Erro ao obter o GPS. Verifique se a localização está ligada.");
    } finally {
      setBuscandoGps(false);
    }
  };

  const buscar = async () => {
    setErro('');
    if (!origem || !destino.trim()) {
      setErro("Por favor, preencha o destino.");
      return;
    }

    setCarregando(true);
    try {
      const opcoes = await getTrajetos(origem, destino);
      
      if (!opcoes || opcoes.length === 0) {
        setErro("Nenhuma rota encontrada para esses locais.");
      } else {
        salvarBuscaRecente(origem, destino).catch(() => {});
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

      <View style={styles.localizacaoCard}>
        <Text style={styles.labelOrigem}>Sua localização (Origem):</Text>
        
        {buscandoGps ? (
          <View style={styles.loadingGps}>
            <ActivityIndicator size="small" color="#006666" />
            <Text style={styles.textoLoading}>Buscando sua localização exata...</Text>
          </View>
        ) : (
          <Text style={styles.textoOrigem}>{origem || "Localização não encontrada"}</Text>
        )}

        <TouchableOpacity onPress={buscarLocalizacao} disabled={buscandoGps} style={styles.botaoAtualizar}>
          <Text style={styles.botaoAtualizarTexto}>Atualizar Localização</Text>
        </TouchableOpacity>
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

      <TouchableOpacity 
        style={[styles.botao, (!origem || buscandoGps) && styles.botaoDesativado]} 
        onPress={buscar} 
        disabled={carregando || !origem || buscandoGps}
      >
        {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botaoTexto}>Buscar Trajetos</Text>}
      </TouchableOpacity>

      <BuscasRecentes
        aoSelecionar={(busca) => {
          if (carregando) return;
          setOrigem(busca.origem);
          setDestino(busca.destino);
          setBuscaSelecionada(busca);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20, justifyContent: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#006666', marginBottom: 30, textAlign: 'center' },
  localizacaoCard: { backgroundColor: '#E0F2F1', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#B2DFDB', marginBottom: 20 },
  labelOrigem: { fontSize: 14, color: '#006666', fontWeight: 'bold', marginBottom: 8 },
  textoOrigem: { fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 12 },
  loadingGps: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  textoLoading: { marginLeft: 8, color: '#666' },
  botaoAtualizar: { alignSelf: 'flex-start' },
  botaoAtualizarTexto: { fontSize: 13, color: '#006666', fontWeight: 'bold', textDecorationLine: 'underline' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, color: '#333', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', fontSize: 16 },
  textoErro: { color: 'red', textAlign: 'center', marginBottom: 15, fontSize: 15 },
  botao: { backgroundColor: '#006666', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  botaoDesativado: { backgroundColor: '#999' },
  botaoTexto: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});