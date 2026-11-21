import React, { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { favoritosStore } from '../utils/favoritosStore';
import { mostrarAviso } from '../utils/dialogos';

export default function FavoritoEstrela({ item, store = favoritosStore, tamanho = 24 }) {
  const [favorito, setFavorito] = useState(Boolean(store.buscar(item)));

  useEffect(() => {
    const atualizar = () => setFavorito(Boolean(store.buscar(item)));
    atualizar();
    return store.inscrever(atualizar);
  }, [store, item.tipo, item.linhaId, item.paradaId, item.origem, item.destino]);

  const alternar = async () => {
    try {
      await store.alternar(item);
    } catch (erro) {
      mostrarAviso('Favoritos', erro.message || 'Não foi possível atualizar os favoritos.');
    }
  };

  return (
    <TouchableOpacity
      onPress={alternar}
      accessibilityLabel={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name={favorito ? 'star' : 'star-outline'}
        size={tamanho}
        color={favorito ? '#D97706' : '#999'}
      />
    </TouchableOpacity>
  );
}