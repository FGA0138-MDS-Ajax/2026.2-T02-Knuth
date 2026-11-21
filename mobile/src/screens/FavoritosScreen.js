import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { favoritosStore } from '../utils/favoritosStore';
import FavoritosCarregador from '../components/FavoritosCarregador';
import FavoritosSecao from '../components/FavoritosSecao';
import RodapeNavegacao from '../components/RodapeNavegacao';

export default function FavoritosScreen({ navigation, store = favoritosStore }) {
  const [logado, setLogado] = useState(store.obter().logado);

  useEffect(() => {
    const atualizar = () => setLogado(store.obter().logado);
    atualizar();
    return store.inscrever(atualizar);
  }, [store]);

  return (
    <View style={styles.container}>
      <FavoritosCarregador navigation={navigation} store={store} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        {logado ? (
          <FavoritosSecao navigation={navigation} store={store} />
        ) : (
          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>Entre na sua conta para ver seus favoritos.</Text>
            <TouchableOpacity style={styles.botao} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.botaoTexto}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <RodapeNavegacao navigation={navigation} ativa="Favoritos" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  conteudo: { padding: 16 },
  aviso: { alignItems: 'center', marginTop: 40 },
  avisoTexto: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 16 },
  botao: { backgroundColor: '#006666', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20 },
  botaoTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});