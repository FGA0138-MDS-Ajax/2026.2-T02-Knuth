import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getTrajetos } from '../services/api';

export default function BuscarTrajetoScreen({ navigation }) {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const buscar = async () => {
    setErro('');
    
    if (!origem.trim() || !destino.trim()) {
      setErro("Por favor, preencha a origem e o destino.");
      return;
    }

    setCarregando(true);
    try {
      const opcoes = await getTrajetos(origem, destino);
      
      if (!opcoes || opcoes.length === 0) {
        setErro("Nenhuma rota direta encontrada. Tente ser mais específico.");
      } else {
        navigation.navigate('ResultadoTrajeto', { opcoes });
      }
    } catch (error) {
      console.error(error);
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Planejar Viagem</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Origem:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Terminal do Gama"
          value={origem}
          onChangeText={setOrigem}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Destino:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Rodoviária do Plano Piloto"
          value={destino}
          onChangeText={setDestino}
        />
      </View>

      {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}

      <TouchableOpacity style={styles.botao} onPress={buscar} disabled={carregando}>
        {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botaoTexto}>Buscar Trajetos</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20, justifyContent: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#006666', marginBottom: 30, textAlign: 'center' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, color: '#333', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', fontSize: 16 },
  textoErro: { color: 'red', textAlign: 'center', marginBottom: 15, fontSize: 15 },
  botao: { backgroundColor: '#006666', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  botaoTexto: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});