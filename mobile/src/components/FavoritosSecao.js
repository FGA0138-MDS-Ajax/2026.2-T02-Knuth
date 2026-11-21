import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { favoritosStore } from '../utils/favoritosStore';
import FavoritoEstrela from './FavoritoEstrela';

export default function FavoritosSecao({ navigation, store = favoritosStore }) {
  const [estado, setEstado] = useState(store.obter());

  useEffect(() => {
    const atualizar = () => setEstado(store.obter());
    const cancelarStore = store.inscrever(atualizar);
    store.carregar();
    const cancelarFoco =
      navigation && navigation.addListener
        ? navigation.addListener('focus', () => store.carregar())
        : undefined;

    return () => {
      cancelarStore();
      if (cancelarFoco) cancelarFoco();
    };
  }, [store, navigation]);

  if (!estado.logado) {
    return null;
  }

  const linhas = estado.favoritos.filter((favorito) => favorito.tipo === 'LINHA');

  return (
    <View style={styles.secao}>
      <View style={styles.titulo}>
        <Ionicons name="star" size={18} color="#D97706" />
        <Text style={styles.tituloTexto}>Favoritos</Text>
      </View>

      {linhas.length === 0 ? (
        <Text style={styles.dica}>Toque na estrela de uma linha para salvá-la aqui.</Text>
      ) : (
        linhas.map((favorito) => (
          <TouchableOpacity
            key={favorito.id}
            style={styles.card}
            onPress={() => navigation.navigate('Horarios', { linhaId: favorito.linhaId })}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{favorito.linhaCodigo}</Text>
            </View>
            <Text style={styles.nomeLinha} numberOfLines={2}>{favorito.linhaNome}</Text>
            <FavoritoEstrela item={{ tipo: 'LINHA', linhaId: favorito.linhaId }} store={store} />
          </TouchableOpacity>
        ))
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
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  nomeLinha: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', marginRight: 8 }
});