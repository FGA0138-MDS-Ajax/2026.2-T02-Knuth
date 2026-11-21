import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import {
  getTrajetos,
  getParadaProxima,
  buscarParadas,
  getBuscasRecentes,
  salvarBuscaRecente,
} from '../services/api';
import {
  listarTrajetosRecentes,
  salvarTrajetoRecenteLocal,
  mesclarTrajetosRecentes,
  obterUsuarioLogadoId,
} from '../utils/buscasRecentesStorage';
import AlertaBanner from '../components/AlertaBanner';
import FavoritoEstrela from '../components/FavoritoEstrela';
import FavoritosCarregador from '../components/FavoritosCarregador';

export default function BuscarTrajetoScreen({ route, navigation }) {
  const origemInicial = route?.params?.origem || '';
  const destinoInicial = route?.params?.destino || '';

  const [origem, setOrigem] = useState(origemInicial);
  const [editandoOrigem, setEditandoOrigem] = useState(false);
  const [paradaOrigemId, setParadaOrigemId] = useState(null);
  const [alertasOrigem, setAlertasOrigem] = useState([]);
  const [origemAfetadaPorAlerta, setOrigemAfetadaPorAlerta] = useState(false);
  const [destino, setDestino] = useState(destinoInicial);
  const [sugestoesOrigem, setSugestoesOrigem] = useState([]);
  const [sugestoesDestino, setSugestoesDestino] = useState([]);
  const [buscasRecentes, setBuscasRecentes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [buscandoGps, setBuscandoGps] = useState(!origemInicial);
  const [erro, setErro] = useState('');

  const timerOrigemRef = useRef(null);
  const timerDestinoRef = useRef(null);

  const carregarBuscasRecentes = async () => {
    const locais = await listarTrajetosRecentes();
    setBuscasRecentes(locais);

    if (typeof getBuscasRecentes !== 'function') {
      return;
    }

    try {
      const usuarioId = await obterUsuarioLogadoId();
      if (usuarioId !== null) {
        const remotas = await getBuscasRecentes(usuarioId, 5);
        if (Array.isArray(remotas) && remotas.length > 0) {
          setBuscasRecentes(mesclarTrajetosRecentes(locais, remotas, 5));
        }
      }
    } catch (_err) {
      // Mantém histórico local em caso de erro de rede
    }
  };

  useEffect(() => {
    carregarBuscasRecentes();
    const removerListener = navigation?.addListener?.('focus', carregarBuscasRecentes);
    return () => {
      if (typeof removerListener === 'function') removerListener();
      if (timerOrigemRef.current) clearTimeout(timerOrigemRef.current);
      if (timerDestinoRef.current) clearTimeout(timerDestinoRef.current);
    };
  }, [navigation]);

  useEffect(() => {
    if (origemInicial) {
      setOrigem(origemInicial);
      setParadaOrigemId(null);
      setBuscandoGps(false);
      setEditandoOrigem(false);
      if (destinoInicial) {
        setDestino(destinoInicial);
      }
      return;
    }
    buscarLocalizacao();
  }, [origemInicial, destinoInicial]);

  const consultarSugestoes = (texto, setSugestoes, timerRef) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const termo = texto.trim();
    if (termo.length < 2 || typeof buscarParadas !== 'function') {
      setSugestoes([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        const resultados = await buscarParadas(termo, 6);
        setSugestoes(Array.isArray(resultados) ? resultados : []);
      } catch (_err) {
        setSugestoes([]);
      }
    }, 250);
  };

  const aoAlterarOrigem = (texto) => {
    setOrigem(texto);
    setParadaOrigemId(null);
    setAlertasOrigem([]);
    setOrigemAfetadaPorAlerta(false);
    consultarSugestoes(texto, setSugestoesOrigem, timerOrigemRef);
  };

  const aoAlterarDestino = (texto) => {
    setDestino(texto);
    consultarSugestoes(texto, setSugestoesDestino, timerDestinoRef);
  };

  const selecionarSugestaoOrigem = (parada) => {
    if (timerOrigemRef.current) clearTimeout(timerOrigemRef.current);
    setOrigem(parada.nome);
    setParadaOrigemId(parada.id !== undefined && parada.id !== null ? String(parada.id) : null);
    setSugestoesOrigem([]);
    setEditandoOrigem(false);
    setErro('');
  };

  const selecionarSugestaoDestino = (parada) => {
    if (timerDestinoRef.current) clearTimeout(timerDestinoRef.current);
    setDestino(parada.nome);
    setSugestoesDestino([]);
    setErro('');
  };

  const buscarLocalizacao = async () => {
    setBuscandoGps(true);
    setEditandoOrigem(false);
    setSugestoesOrigem([]);
    setErro('');
    setOrigem('');
    setParadaOrigemId(null);
    setAlertasOrigem([]);
    setOrigemAfetadaPorAlerta(false);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErro('Permissão negada. Ative o GPS para usar o planejador.');
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
        setErro('Nenhuma parada encontrada próxima à sua localização.');
      }
    } catch (error) {
      console.error(error);
      setErro('Erro ao obter o GPS. Verifique se a localização está ligada.');
    } finally {
      setBuscandoGps(false);
    }
  };

  const executarBusca = async (origemBusca, destinoBusca, destinoOriginal = destinoBusca) => {
    if (timerOrigemRef.current) clearTimeout(timerOrigemRef.current);
    if (timerDestinoRef.current) clearTimeout(timerDestinoRef.current);
    setSugestoesOrigem([]);
    setSugestoesDestino([]);
    setErro('');

    const origemLimpa = String(origemBusca || '').trim();
    const destinoLimpo = String(destinoBusca || '').trim();

    if (!origemLimpa || !destinoLimpo) {
      setErro('Por favor, preencha o destino.');
      return;
    }

    setCarregando(true);
    try {
      const opcoes = await getTrajetos(origemLimpa, destinoOriginal);
      if (!opcoes || opcoes.length === 0) {
        setErro('Nenhuma rota encontrada para esses locais.');
      } else {
        salvarTrajetoRecenteLocal(origemLimpa, destinoLimpo)
          .then(setBuscasRecentes)
          .catch(() => {});
        if (typeof salvarBuscaRecente === 'function') {
          obterUsuarioLogadoId()
            .then((usuarioId) => salvarBuscaRecente(origemLimpa, destinoLimpo, usuarioId))
            .catch(() => {});
        }
        navigation.navigate('ResultadoTrajeto', {
          opcoes,
          origem: origemLimpa,
          destino: destinoLimpo,
        });
      }
    } catch (error) {
      console.error(error);
      setErro('Erro ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const buscar = async () => {
    await executarBusca(origem, destino, destino);
  };

  const repetirBuscaRecente = async (item) => {
    setOrigem(item.origem);
    setDestino(item.destino);
    setEditandoOrigem(false);
    setParadaOrigemId(null);
    await executarBusca(item.origem, item.destino, item.destino);
  };

  const podeFavoritarTrajeto = Boolean(origem.trim() && destino.trim());

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
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
        ) : editandoOrigem ? (
          <View style={styles.origemEditContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ex: UnB, Taguatinga, W3 Norte..."
              value={origem}
              onChangeText={aoAlterarOrigem}
              autoFocus
            />
            {sugestoesOrigem.length > 0 ? (
              <View style={styles.listaSugestoes}>
                {sugestoesOrigem.map((parada) => (
                  <TouchableOpacity
                    key={String(parada.id)}
                    style={styles.itemSugestao}
                    onPress={() => selecionarSugestaoOrigem(parada)}
                  >
                    <Text style={styles.textoSugestao} numberOfLines={2}>
                      {parada.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.textoOrigem}>{origem || 'Localização não encontrada'}</Text>
        )}

        <View style={styles.acoesOrigem}>
          <TouchableOpacity
            onPress={buscarLocalizacao}
            disabled={buscandoGps}
            style={styles.botaoAtualizar}
          >
            <Text style={styles.botaoAtualizarTexto}>Atualizar Localização</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSugestoesOrigem([]);
              setEditandoOrigem((atual) => !atual);
            }}
            disabled={buscandoGps}
            style={styles.botaoAtualizar}
          >
            <Text style={styles.botaoAtualizarTexto}>
              {editandoOrigem ? 'Confirmar origem' : 'Digitar outra origem'}
            </Text>
          </TouchableOpacity>
        </View>

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
          onChangeText={aoAlterarDestino}
        />
        {sugestoesDestino.length > 0 ? (
          <View style={styles.listaSugestoes}>
            {sugestoesDestino.map((parada) => (
              <TouchableOpacity
                key={String(parada.id)}
                style={styles.itemSugestao}
                onPress={() => selecionarSugestaoDestino(parada)}
              >
                <Text style={styles.textoSugestao} numberOfLines={2}>
                  {parada.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      {podeFavoritarTrajeto ? (
        <View style={styles.favoritarTrajetoRow}>
          <Text style={styles.favoritarTrajetoTexto}>Salvar este trajeto nos favoritos</Text>
          <FavoritoEstrela
            item={{ tipo: 'TRAJETO', origem: origem.trim(), destino: destino.trim() }}
            tamanho={22}
          />
        </View>
      ) : null}

      {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}

      <TouchableOpacity
        style={[styles.botao, (!origem.trim() || buscandoGps) && styles.botaoDesativado]}
        onPress={buscar}
        disabled={carregando || !origem.trim() || buscandoGps}
      >
        {carregando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.botaoTexto}>Buscar Trajetos</Text>
        )}
      </TouchableOpacity>

      {buscasRecentes.length > 0 ? (
        <View style={styles.recentesContainer}>
          <Text style={styles.recentesTitulo}>Buscas recentes</Text>
          {buscasRecentes.map((item, idx) => (
            <TouchableOpacity
              key={`${item.origem}-${item.destino}-${idx}`}
              style={styles.recenteItem}
              onPress={() => repetirBuscaRecente(item)}
              disabled={carregando}
            >
              <Text style={styles.recenteTexto} numberOfLines={2}>
                {item.origem} → {item.destino}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F5F5F5', padding: 20, justifyContent: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#006666', marginBottom: 30, textAlign: 'center' },
  localizacaoCard: { backgroundColor: '#E0F2F1', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#B2DFDB', marginBottom: 20 },
  origemCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  origemEditContainer: { marginBottom: 10 },
  acoesOrigem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
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
  listaSugestoes: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  itemSugestao: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  textoSugestao: { fontSize: 14, color: '#333' },
  textoErro: { color: 'red', textAlign: 'center', marginBottom: 15, fontSize: 15 },
  botao: { backgroundColor: '#006666', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  botaoDesativado: { backgroundColor: '#999' },
  botaoTexto: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  recentesContainer: { marginTop: 24 },
  recentesTitulo: { fontSize: 15, fontWeight: 'bold', color: '#006666', marginBottom: 10 },
  recenteItem: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  recenteTexto: { fontSize: 14, color: '#333' },
});
