import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getNotificacoesNaoLidas } from '../services/api';

export default function SeloAvisos({ navigation }) {
  const [quantidade, setQuantidade] = useState(0);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const modulo = require('@react-native-async-storage/async-storage');
        const AsyncStorage = modulo.default || modulo;
        const token = await AsyncStorage.getItem('@rotasdf_token');
        if (!token) {
          return;
        }
        const { naoLidas } = await getNotificacoesNaoLidas(token);
        if (ativo) {
          setQuantidade(naoLidas);
        }
      } catch (erro) {
        if (ativo) {
          setQuantidade(0);
        }
      }
    };

    carregar();
    const remover = navigation?.addListener?.('focus', carregar);

    return () => {
      ativo = false;
      if (typeof remover === 'function') {
        remover();
      }
    };
  }, [navigation]);

  if (quantidade <= 0) {
    return null;
  }

  return (
    <View style={styles.selo} accessibilityLabel={`${quantidade} avisos não lidos`}>
      <Text style={styles.texto}>{quantidade > 9 ? '9+' : String(quantidade)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: { position: 'absolute', top: -6, right: '28%', minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#D97706', alignItems: 'center', justifyContent: 'center' },
  texto: { color: '#FFF', fontSize: 11, fontWeight: '700' }
});
