import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

const ABAS = [
  { nome: 'Linhas', icone: 'bus-outline', iconeAtivo: 'bus' },
  { nome: 'Favoritos', icone: 'star-outline', iconeAtivo: 'star' },
];

export default function RodapeNavegacao({ navigation, ativa }) {
  const insets = useContext(SafeAreaInsetsContext);
  const paddingBottom = Math.max(insets?.bottom || 0, 8) + 6;

  return (
    <View testID="rodape-navegacao" style={[styles.barra, { paddingBottom }]}>
      {ABAS.map((aba) => {
        const selecionada = aba.nome === ativa;
        const cor = selecionada ? '#006666' : '#888';

        return (
          <TouchableOpacity
            key={aba.nome}
            style={styles.aba}
            accessibilityLabel={`Aba ${aba.nome}`}
            accessibilityState={{ selected: selecionada }}
            onPress={() => {
              if (!selecionada) navigation.navigate(aba.nome);
            }}
          >
            <Ionicons name={selecionada ? aba.iconeAtivo : aba.icone} size={22} color={cor} />
            <Text style={[styles.texto, { color: cor }]}>{aba.nome}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    paddingTop: 10,
  },
  aba: { flex: 1, alignItems: 'center' },
  texto: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
