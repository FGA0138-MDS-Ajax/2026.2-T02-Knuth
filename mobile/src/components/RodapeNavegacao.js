import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ABAS = [
  { nome: 'Linhas', icone: 'bus-outline', iconeAtivo: 'bus' },
  { nome: 'Favoritos', icone: 'star-outline', iconeAtivo: 'star' },
];

export default function RodapeNavegacao({ navigation, ativa }) {
  return (
    <View style={styles.barra}>
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
  barra: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#DDD', paddingVertical: 8 },
  aba: { flex: 1, alignItems: 'center' },
  texto: { fontSize: 12, fontWeight: '600', marginTop: 2 }
});