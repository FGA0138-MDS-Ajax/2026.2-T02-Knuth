import axios from 'axios';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:3000/api/v1`;

export const getLinhas = async (busca) => {
  const response = await axios.get(`${API_BASE_URL}/linhas`, {
    params: { busca }
  });
  return response.data;
};

export const getItinerario = async (linhaId, sentido = 'IDA') => {
  const response = await axios.get(`${API_BASE_URL}/linhas/${linhaId}/itinerario`, {
    params: { sentido }
  });
  return response.data;
};

export const getHorarios = async (linhaId, sentido = 'IDA') => {
  const response = await axios.get(`${API_BASE_URL}/linhas/${linhaId}/horarios`, {
    params: { sentido }
  });
  return response.data;
};

export const getTrajetos = async (origem, destino) => {
  const response = await axios.get(`${API_BASE_URL}/trajetos`, {
    params: { origem, destino }
  });
  return response.data;
};

export const getParadaProxima = async (lat, lng) => {
  const response = await axios.get(`${API_BASE_URL}/paradas/proximas`, {
    params: { lat, lng }
  });
  return response.data;
};

export const cadastrarUsuario = async (nome, email, senha) => {
  const response = await axios.post(`${API_BASE_URL}/usuarios/cadastro`, { nome, email, senha });
  return response.data;
};

export const loginUsuario = async (email, senha) => {
  const response = await axios.post(`${API_BASE_URL}/usuarios/login`, { email, senha });
  return response.data;
};

// RF16 - Recuperação de senha e exclusão da própria conta
export const solicitarRecuperacaoSenha = async (email) => {
  const response = await axios.post(`${API_BASE_URL}/usuarios/recuperar-senha`, { email });
  return response.data;
};

export const redefinirSenha = async (email, codigo, novaSenha) => {
  const response = await axios.post(`${API_BASE_URL}/usuarios/redefinir-senha`, { email, codigo, novaSenha });
  return response.data;
};

export const excluirMinhaConta = async (token, senha) => {
  const response = await axios.delete(`${API_BASE_URL}/usuarios/me`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { senha }
  });
  return response.data;
};

export const getAlertas = async () => {
  const response = await axios.get(`${API_BASE_URL}/alertas`);
  return response.data;
};

// RF19 - Reportar divergência na informação (Passageiro)
export const reportarDivergencia = async ({ tipo, descricao, linhaId, paradaId, usuarioId }) => {
  const response = await axios.post(`${API_BASE_URL}/reportes`, {
    tipo,
    descricao,
    linhaId: linhaId || null,
    paradaId: paradaId || null,
    usuarioId: usuarioId ?? null,
  });
  return response.data;
};

export const getPerfilAdmin = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/admin/perfil`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const criarAdministrador = async (token, nome, email, senha) => {
  const response = await axios.post(
    `${API_BASE_URL}/admin/usuarios`,
    { nome, email, senha },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const listarUsuarios = async (token, tipo) => {
  const response = await axios.get(`${API_BASE_URL}/admin/usuarios`, {
    params: { tipo },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const atualizarUsuario = async (token, id, dados) => {
  const response = await axios.put(`${API_BASE_URL}/admin/usuarios/${id}`, dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const excluirUsuario = async (token, id) => {
  const response = await axios.delete(`${API_BASE_URL}/admin/usuarios/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};