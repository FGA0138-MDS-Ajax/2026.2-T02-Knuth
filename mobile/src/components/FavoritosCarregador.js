import { useEffect } from 'react';
import { favoritosStore } from '../utils/favoritosStore';

export default function FavoritosCarregador({ navigation, store = favoritosStore }) {
  useEffect(() => {
    store.carregar();
    const cancelarFoco =
      navigation && navigation.addListener
        ? navigation.addListener('focus', () => store.carregar())
        : undefined;

    return () => {
      if (cancelarFoco) cancelarFoco();
    };
  }, [store, navigation]);

  return null;
}
