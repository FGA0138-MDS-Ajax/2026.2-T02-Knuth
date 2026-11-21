import { Alert, Platform } from 'react-native';

// Alert.alert não funciona no navegador (react-native-web); por isso, na web
// usamos window.alert / window.confirm.
export function mostrarAviso(titulo, mensagem) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
    return;
  }
  Alert.alert(titulo, mensagem);
}

export function confirmarAcao(titulo, mensagem, textoConfirmar, aoConfirmar) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) {
      aoConfirmar();
    }
    return;
  }

  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: textoConfirmar, style: 'destructive', onPress: aoConfirmar },
  ]);
}
