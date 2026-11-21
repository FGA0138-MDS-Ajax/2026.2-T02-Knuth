import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { solicitarRecuperacaoSenha, redefinirSenha } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODIGO_VALIDO = /^\d{6}$/;
const TAMANHO_MINIMO_SENHA = 6;
const MSG_CODIGO_ENVIADO = 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.';

// RF16 - Recuperação de senha do passageiro em duas etapas:
// 1) informar o e-mail e receber o código; 2) informar o código e a nova senha.
export default function RecuperarSenhaScreen({ navigation, route }) {
  const [etapa, setEtapa] = useState('email');
  const [email, setEmail] = useState(route?.params?.email || '');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);

  const enviarCodigo = async () => {
    const emailInformado = email.trim();

    if (!emailInformado) {
      mostrarAviso('Atenção', 'Informe o e-mail da sua conta.');
      return;
    }
    if (!EMAIL_VALIDO.test(emailInformado)) {
      mostrarAviso('Atenção', 'Informe um e-mail válido.');
      return;
    }

    setCarregando(true);
    try {
      const dados = await solicitarRecuperacaoSenha(emailInformado);
      let mensagem = dados?.mensagem || MSG_CODIGO_ENVIADO;
      if (dados?.codigoDev) {
        mensagem += `\n\nCódigo (ambiente de desenvolvimento): ${dados.codigoDev}`;
      }

      mostrarAviso('Verifique seu e-mail', mensagem);
      setEmail(emailInformado);
      setEtapa('codigo');
    } catch (error) {
      const msg = error.response?.data?.detalhes || 'Não foi possível enviar o código. Tente novamente.';
      mostrarAviso('Erro', msg);
    } finally {
      setCarregando(false);
    }
  };

  const redefinir = async () => {
    const codigoInformado = codigo.trim();

    if (!codigoInformado || !novaSenha || !confirmacao) {
      mostrarAviso('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (!CODIGO_VALIDO.test(codigoInformado)) {
      mostrarAviso('Atenção', 'O código deve ter 6 dígitos.');
      return;
    }
    if (novaSenha.length < TAMANHO_MINIMO_SENHA) {
      mostrarAviso('Atenção', `A nova senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
      return;
    }
    if (novaSenha !== confirmacao) {
      mostrarAviso('Atenção', 'As senhas não conferem.');
      return;
    }

    setCarregando(true);
    try {
      await redefinirSenha(email, codigoInformado, novaSenha);
      mostrarAviso('Senha redefinida', 'Sua senha foi alterada. Faça login com a nova senha.');
      navigation.navigate('Login');
    } catch (error) {
      const msg = error.response?.data?.detalhes || 'Não foi possível redefinir a senha. Tente novamente.';
      mostrarAviso('Erro', msg);
    } finally {
      setCarregando(false);
    }
  };

  const usarOutroEmail = () => {
    setCodigo('');
    setNovaSenha('');
    setConfirmacao('');
    setEtapa('email');
  };

  if (etapa === 'email') {
    return (
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Recuperar senha</Text>
        <Text style={styles.texto}>
          Informe o e-mail da sua conta. Enviaremos um código para você criar uma nova senha.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.botao} onPress={enviarCodigo} disabled={carregando}>
          {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botaoTexto}>Enviar código</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Voltar para o login</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>Criar nova senha</Text>
      <Text style={styles.texto}>
        Digite o código enviado para {email} e escolha uma nova senha.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Código de 6 dígitos"
        value={codigo}
        onChangeText={setCodigo}
        keyboardType="number-pad"
        maxLength={6}
      />
      <TextInput
        style={styles.input}
        placeholder="Nova senha"
        value={novaSenha}
        onChangeText={setNovaSenha}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar nova senha"
        value={confirmacao}
        onChangeText={setConfirmacao}
        secureTextEntry
      />

      <TouchableOpacity style={styles.botao} onPress={redefinir} disabled={carregando}>
        {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botaoTexto}>Redefinir senha</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={enviarCodigo} disabled={carregando}>
        <Text style={styles.link}>Não recebeu? Reenviar código</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={usarOutroEmail}>
        <Text style={styles.link}>Usar outro e-mail</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F5F5F5', padding: 24, justifyContent: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  texto: { fontSize: 15, color: '#555', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', fontSize: 16, marginBottom: 15 },
  botao: { backgroundColor: '#006666', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  botaoTexto: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#006666', marginTop: 20, fontSize: 15, fontWeight: '500' }
});
