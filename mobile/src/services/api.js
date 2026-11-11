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

export const getItinerario = async (linhaId) => {
  const response = await axios.get(`${API_BASE_URL}/linhas/${linhaId}/itinerario`);
  return response.data;
};

export const getHorarios = async (linhaId) => {
  const response = await axios.get(`${API_BASE_URL}/linhas/${linhaId}/horarios`);
  return response.data;
};

export const getBuscasRecentes = async (limite) => {
  const response = await axios.get(`${API_BASE_URL}/buscas-recentes`, {
    params: { limite }
  });
  return response.data;
};

export const salvarBuscaRecente = async (origem, destino) => {
  const response = await axios.post(`${API_BASE_URL}/buscas-recentes`, { origem, destino });
  return response.data;
};

export const getTrajetos = async (origem, destino) => {
  const response = await axios.get(`${API_BASE_URL}/trajetos`, {
    params: { origem, destino }
  });
  return response.data;
};