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

export const getTrajetos = async (origem, destino, opcoes = {}) => {
  const params = { origem, destino };

  // Compatibilidade com chamadas antigas da RF05
  if (typeof opcoes === 'string') {
    opcoes = { ordenarPor: opcoes };
  }

  // RF05 - Ordenação de trajetos
  if (opcoes?.ordenarPor) {
    params.ordenarPor = opcoes.ordenarPor;
  }

  // RF06 - Planejamento por horário
  if (opcoes?.horario) {
    params.horario = opcoes.horario;
  }

  if (opcoes?.referenciaHorario) {
    params.referenciaHorario = opcoes.referenciaHorario;
  }

  const response = await axios.get(`${API_BASE_URL}/trajetos`, {
    params
  });

  return response.data;
};

export const getParadaProxima = async (lat, lng) => {
  const response = await axios.get(`${API_BASE_URL}/paradas/proximas`, {
    params: { lat, lng }
  });
  return response.data;
};

export const buscarParadas = async (busca, limite = 8) => {
  const response = await axios.get(`${API_BASE_URL}/paradas`, {
    params: { busca, limite }
  });
  return response.data;
};

export const getProximasPartidasParada = async (paradaId, opcoes = {}) => {
  const params = {};

  if (opcoes.horario) params.horario = opcoes.horario;
  if (opcoes.tipoDia) params.tipoDia = opcoes.tipoDia;
  if (opcoes.limite) params.limite = opcoes.limite;

  const response = await axios.get(
    `${API_BASE_URL}/paradas/${paradaId}/proximas-partidas`,
    { params }
  );

  return response.data;
};

export const getBuscasRecentes = async (usuarioId = null, limite = 5) => {
  const params = { limite };

  if (usuarioId !== null && usuarioId !== undefined) {
    params.usuarioId = usuarioId;
  }

  const response = await axios.get(`${API_BASE_URL}/buscas-recentes`, {
    params
  });

  return response.data;
};

export const salvarBuscaRecente = async (origem, destino, usuarioId = null) => {
  const payload = { origem, destino };

  if (usuarioId !== null && usuarioId !== undefined) {
    payload.usuarioId = usuarioId;
  }

  const response = await axios.post(
    `${API_BASE_URL}/buscas-recentes`,
    payload
  );

  return response.data;
};

export const cadastrarUsuario = async (nome, email, senha) => {
  const response = await axios.post(`${API_BASE_URL}/usuarios/cadastro`, {
    nome,
    email,
    senha
  });

  return response.data;
};

export const loginUsuario = async (email, senha) => {
  const response = await axios.post(`${API_BASE_URL}/usuarios/login`, {
    email,
    senha
  });

  return response.data;
};

export const getAlertas = async (filtros) => {
  const response = await axios.get(
    `${API_BASE_URL}/alertas`,
    filtros ? { params: filtros } : undefined
  );

  return response.data;
};

export const solicitarRecuperacaoSenha = async (email) => {
  const response = await axios.post(
    `${API_BASE_URL}/usuarios/recuperar-senha`,
    { email }
  );

  return response.data;
};

export const redefinirSenha = async (email, codigo, novaSenha) => {
  const response = await axios.post(
    `${API_BASE_URL}/usuarios/redefinir-senha`,
    {
      email,
      codigo,
      novaSenha
    }
  );

  return response.data;
};

export const excluirMinhaConta = async (token, senha) => {
  const response = await axios.delete(`${API_BASE_URL}/usuarios/me`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { senha }
  });

  return response.data;
};

export const reportarDivergencia = async ({
  tipo,
  descricao,
  linhaId,
  paradaId,
  usuarioId
}) => {
  const response = await axios.post(`${API_BASE_URL}/reportes`, {
    tipo,
    descricao,
    linhaId: linhaId || null,
    paradaId: paradaId || null,
    usuarioId: usuarioId ?? null
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
  const response = await axios.put(
    `${API_BASE_URL}/admin/usuarios/${id}`,
    dados,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return response.data;
};

export const excluirUsuario = async (token, id) => {
  const response = await axios.delete(`${API_BASE_URL}/admin/usuarios/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};

export const listarAlertasAdmin = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/admin/alertas`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};

export const criarAlerta = async (token, dados) => {
  const response = await axios.post(
    `${API_BASE_URL}/admin/alertas`,
    dados,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return response.data;
};

export const encerrarAlerta = async (token, id) => {
  const response = await axios.put(
    `${API_BASE_URL}/admin/alertas/${id}/encerrar`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return response.data;
};

export const excluirAlerta = async (token, id) => {
  const response = await axios.delete(`${API_BASE_URL}/admin/alertas/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};

export const editarAlerta = async (token, id, dados) => {
  const response = await axios.put(
    `${API_BASE_URL}/admin/alertas/${id}`,
    dados,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return response.data;
};

export const buscarParadasAdmin = async (token, busca) => {
  const response = await axios.get(`${API_BASE_URL}/admin/paradas`, {
    params: { busca },
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};

export const getFavoritos = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/favoritos`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};

export const adicionarFavorito = async (token, dados) => {
  const response = await axios.post(
    `${API_BASE_URL}/favoritos`,
    dados,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return response.data;
};

export const removerFavorito = async (token, id) => {
  const response = await axios.delete(`${API_BASE_URL}/favoritos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};

export const listarReportesAdmin = async (token, filtros = {}) => {
  const response = await axios.get(`${API_BASE_URL}/admin/reportes`, {
    params: filtros,
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};

export const obterReporteAdmin = async (token, id) => {
  const response = await axios.get(`${API_BASE_URL}/admin/reportes/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};

export const analisarReporteAdmin = async (token, id, dados) => {
  const response = await axios.patch(
    `${API_BASE_URL}/admin/reportes/${id}`,
    dados,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return response.data;
};

