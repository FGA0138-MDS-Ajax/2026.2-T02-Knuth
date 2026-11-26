import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { favoritosStore } from '../utils/favoritosStore';
import FavoritoEstrela from './FavoritoEstrela';

// RF17 - Exibe linhas, paradas e trajetos favoritos em destaque para consulta em um toque
export default function FavoritosSecao({ navigation, store = favoritosStore }) {
  const [estado, setEstado] = useState(store.obter());

  useEffect(() => {
    const atualizar = () => setEstado(store.obter());
    atualizar();
    return store.inscrever(atualizar);
  }, [store]);

  if (!estado.logado) {
    return null;
  }

  const linhas = estado.favoritos.filter((favorito) => favorito.tipo === 'LINHA');
  const paradas = estado.favoritos.filter((favorito) => favorito.tipo === 'PARADA');
  const trajetos = estado.favoritos.filter((favorito) => favorito.tipo === 'TRAJETO');
  const semFavoritos = linhas.length === 0 && paradas.length === 0 && trajetos.length === 0;

  return (
    <View style={styles.secao}>
      <View style={styles.titulo}>
        <Ionicons name="star" size={18} color="#D97706" />
        <Text style={styles.tituloTexto}>Favoritos</Text>
      </View>

      {semFavoritos ? (
        <Text style={styles.dica}>
          Toque na estrela de uma linha, parada ou trajeto para salvá-lo aqui.
        </Text>
      ) : (
        <View>
          {linhas.map((favorito) => (
            <TouchableOpacity
              key={favorito.id}
              style={styles.card}
              onPress={() => navigation.navigate('Horarios', { linhaId: favorito.linhaId })}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{favorito.linhaCodigo}</Text>
              </View>
              <Text style={styles.nomeItem} numberOfLines={2}>{favorito.linhaNome}</Text>
              <FavoritoEstrela item={{ tipo: 'LINHA', linhaId: favorito.linhaId }} store={store} />
            </TouchableOpacity>
          ))}

          {paradas.map((favorito) => {
            const nomeParada = favorito.paradaNome || favorito.paradaCodigo || favorito.paradaId;
            return (
              <TouchableOpacity
                key={favorito.id}
                style={styles.card}
                onPress={() => navigation.navigate('BuscarTrajeto', { origem: nomeParada })}
              >
                <View style={[styles.badge, styles.badgeParada]}>
                  <Text style={styles.badgeText}>{favorito.paradaCodigo || 'Parada'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.nomeItem} numberOfLines={2}>{nomeParada}</Text>
                  <Text style={styles.subtituloItem}>Parada favorita • Toque para planejar</Text>
                </View>
                <TouchableOpacity
                  style={styles.botaoPartidas}
                  onPress={() =>
                    navigation.navigate('ProximasPartidas', {
                      paradaId: favorito.paradaId,
                      paradaNome: nomeParada,
                      paradaCodigo: favorito.paradaCodigo,
                    })
                  }
                >
                  <Text style={styles.botaoPartidasTexto}>Partidas</Text>
                </TouchableOpacity>
                <FavoritoEstrela
                  item={{ tipo: 'PARADA', paradaId: favorito.paradaId }}
                  store={store}
                />
              </TouchableOpacity>
            );
          })}

          {trajetos.map((favorito) => (
            <TouchableOpacity
              key={favorito.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate('BuscarTrajeto', {
                  origem: favorito.origem,
                  destino: favorito.destino,
                })
              }
            >
              <View style={[styles.badge, styles.badgeTrajeto]}>
                <Text style={styles.badgeText}>Trajeto</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.nomeItem} numberOfLines={2}>
                  {favorito.origem} → {favorito.destino}
                </Text>
                <Text style={styles.subtituloItem}>Trajeto favorito • Toque para consultar</Text>
              </View>
              <FavoritoEstrela
                item={{ tipo: 'TRAJETO', origem: favorito.origem, destino: favorito.destino }}
                store={store}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { marginBottom: 16 },
  titulo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tituloTexto: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 6 },
  dica: { fontSize: 13, color: '#666' },
  card: { flexDirection: 'row', backgroundColor: '#FFF7E6', padding: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#F3D9A4' },
  badge: { backgroundColor: '#006666', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginRight: 12 },
  badgeParada: { backgroundColor: '#004C4C' },
  badgeTrajeto: { backgroundColor: '#B45309' },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  infoItem: { flex: 1, marginRight: 8 },
  nomeItem: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', marginRight: 8 },
  subtituloItem: { fontSize: 12, color: '#666', marginTop: 2 },
  botaoPartidas: { backgroundColor: '#006666', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, marginRight: 6 },
  botaoPartidasTexto: { color: '#FFF', fontSize: 12, fontWeight: '600' },
});
