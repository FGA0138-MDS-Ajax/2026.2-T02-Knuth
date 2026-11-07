import axios from 'axios';
import Constants from 'expo-constants';

// Captura automaticamente o IP da máquina que está a rodar o Expo
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:3000/api`;

export const getItinerario = async (linhaId) => {
  const response = await axios.get(`${API_URL}/${linhaId}/itinerario`);
  return response.data;
};

export const getHorarios = async (linhaId) => {
  const response = await axios.get(`${API_URL}/${linhaId}/horarios`);
  return response.data;
};