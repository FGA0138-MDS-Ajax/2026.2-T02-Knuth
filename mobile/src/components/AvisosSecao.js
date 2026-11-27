import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getNotificacoes, marcarNotificacaoLida } from '../services/api';

export default function AvisosSecao() {
  const [token, setToken] = useState(null);
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const modulo = require('@react-native-async-storage/async-storage');
        const AsyncStorage = modulo.default || modulo;
        const tokenSalvo = await AsyncStorage.getItem('@rotasdf_token');
        if (!tokenSalvo) {
          return;
        }
        const lista = await getNotificacoes(tokenSalvo);
        if (ativo) {
          setToken(tokenSalvo);
          setAvisos(lista);
        }
      } catch (erro) {
        if (ativo) {
          setAvisos([]);
        }
      }
    };

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const marcarComoLida = async (aviso) => {
    if (aviso.lida) {
      return;
    }
    try {
      await marcarNotificacaoLida(token, aviso.id);
      setAvisos((atuais) =>
        atuais.map((item) => (item.id === aviso.id ? { ...item, lida: true } : item))
      );
    } catch (erro) {
      return;
    }
  };

  if (avisos.length === 0) {
    return null;
  }

  const naoLidas = avisos.filter((aviso) => !aviso.lida).length;

  return (
    <View style={styles.secao}>
      <View style={styles.titulo}>
        <Text style={styles.tituloTexto}>Avisos</Text>
        {naoLidas > 0 && (
          <Text style={styles.contador}>
            {naoLidas === 1 ? '1 novo' : `${naoLidas} novos`}
          </Text>
        )}
      </View>

      {avisos.map((aviso) => (
        <TouchableOpacity
          key={aviso.id}
          style={[styles.cartao, !aviso.lida && styles.cartaoNovo]}
          onPress={() => marcarComoLida(aviso)}
        >
          <Text style={[styles.cartaoTitulo, !aviso.lida && styles.cartaoTituloNovo]}>
            {aviso.titulo}
          </Text>
          <Text style={styles.cartaoResumo}>{aviso.resumo}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { marginBottom: 20 },
  titulo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tituloTexto: { fontSize: 18, fontWeight: 'bold', color: '#333', marginRight: 8 },
  contador: { backgroundColor: '#D97706', color: '#FFF', fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  cartao: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8 },
  cartaoNovo: { borderLeftWidth: 4, borderLeftColor: '#D97706' },
  cartaoTitulo: { fontSize: 14, color: '#333' },
  cartaoTituloNovo: { fontWeight: '700' },
  cartaoResumo: { fontSize: 12, color: '#666', marginTop: 2 }
});
