import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { getTrajetos, getParadaProxima } from '../services/api';
import AlertaBanner from '../components/AlertaBanner';
import FavoritoEstrela from '../components/FavoritoEstrela';
import FavoritosCarregador from '../components/FavoritosCarregador';

export default function BuscarTrajetoScreen({ route, navigation }) {
  const origemInicial = route?.params?.origem || '';
  const destinoInicial = route?.params?.destino || '';

  const [origem, setOrigem] = useState(origemInicial);
  const [paradaOrigemId, setParadaOrigemId] = useState(null);
  const [alertasOrigem, setAlertasOrigem] = useState([]);
  const [origemAfetadaPorAlerta, setOrigemAfetadaPorAlerta] = useState(false);
  const [destino, setDestino] = useState(destinoInicial);
  const [carregando, setCarregando] = useState(false);
  const [buscandoGps, setBuscandoGps] = useState(!origemInicial);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (origemInicial) {
      setOrigem(origemInicial);
      setParadaOrigemId(null);
      setBuscandoGps(false);
      if (destinoInicial) {
        setDestino(destinoInicial);
      }
      return;
    }
    buscarLocalizacao();
  }, [origemInicial, destinoInicial]);

  const buscarLocalizacao = async () => {
    setBuscandoGps(true);
    setErro('');
    setOrigem('');
    setParadaOrigemId(null);
    setAlertasOrigem([]);
    setOrigemAfetadaPorAlerta(false);
    
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
        setParadaOrigemId(parada.id !== undefined && parada.id !== null ? String(parada.id) : null);
        setAlertasOrigem(Array.isArray(parada.alertas) ? parada.alertas : []);
        setOrigemAfetadaPorAlerta(Boolean(parada.afetadaPorAlerta));
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

    const destinoLimpo = destino.trim();
    setCarregando(true);
    try {
      const opcoes = await getTrajetos(origem, destino);
      if (!opcoes || opcoes.length === 0) {
        setErro("Nenhuma rota encontrada para esses locais.");
      } else {
        navigation.navigate('ResultadoTrajeto', { opcoes, origem, destino: destinoLimpo });
      }
    } catch (error) {
      console.error(error);
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  const podeFavoritarTrajeto = Boolean(origem && destino.trim());

  return (
    <View style={styles.container}>
      <FavoritosCarregador navigation={navigation} />
      <Text style={styles.titulo}>Planejar Viagem</Text>

      <View style={styles.localizacaoCard}>
        <View style={styles.origemCabecalho}>
          <Text style={styles.labelOrigem}>Sua localização (Origem):</Text>
          {paradaOrigemId && !buscandoGps ? (
            <FavoritoEstrela item={{ tipo: 'PARADA', paradaId: paradaOrigemId }} tamanho={22} />
          ) : null}
        </View>
        
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

        <AlertaBanner
          alertas={alertasOrigem}
          afetadaPorAlerta={origemAfetadaPorAlerta}
          compacto
          titulo="Alerta na parada de origem"
          onPress={() => navigation.navigate('Alertas')}
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

      {podeFavoritarTrajeto ? (
        <View style={styles.favoritarTrajetoRow}>
          <Text style={styles.favoritarTrajetoTexto}>Salvar este trajeto nos favoritos</Text>
          <FavoritoEstrela
            item={{ tipo: 'TRAJETO', origem, destino: destino.trim() }}
            tamanho={22}
          />
        </View>
      ) : null}

      {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}

      <TouchableOpacity 
        style={[styles.botao, (!origem || buscandoGps) && styles.botaoDesativado]} 
        onPress={buscar} 
        disabled={carregando || !origem || buscandoGps}
      >
        {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botaoTexto}>Buscar Trajetos</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20, justifyContent: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#006666', marginBottom: 30, textAlign: 'center' },
  localizacaoCard: { backgroundColor: '#E0F2F1', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#B2DFDB', marginBottom: 20 },
  origemCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  labelOrigem: { fontSize: 14, color: '#006666', fontWeight: 'bold' },
  favoritarTrajetoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF7E6', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F3D9A4', marginBottom: 16 },
  favoritarTrajetoTexto: { fontSize: 14, color: '#333', fontWeight: '600' },
  textoOrigem: { fontSize: 18, color: '#333', fontWeight: '600', marginBottom: 12 },
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