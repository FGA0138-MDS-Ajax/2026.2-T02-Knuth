import AsyncStorage from '@react-native-async-storage/async-storage';

export const CHAVE_BUSCAS_RECENTES = '@rotasdf_buscas_recentes';
const LIMITE_ITENS = 5;

function normalizarChave(texto) {
  return String(texto || '').trim().toLowerCase();
}

function parseHistorico(bruto) {
  if (!bruto) {
    return { trajetos: [], linhas: [] };
  }

  try {
    const parsed = JSON.parse(bruto);
    if (Array.isArray(parsed)) {
      return {
        trajetos: parsed.filter((item) => item && item.origem && item.destino).slice(0, LIMITE_ITENS),
        linhas: [],
      };
    }
    if (parsed && typeof parsed === 'object') {
      return {
        trajetos: Array.isArray(parsed.trajetos) ? parsed.trajetos.slice(0, LIMITE_ITENS) : [],
        linhas: Array.isArray(parsed.linhas) ? parsed.linhas.slice(0, LIMITE_ITENS) : [],
      };
    }
  } catch (_err) {
    return { trajetos: [], linhas: [] };
  }

  return { trajetos: [], linhas: [] };
}

export async function carregarHistorico() {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_BUSCAS_RECENTES);
    return parseHistorico(bruto);
  } catch (_err) {
    return { trajetos: [], linhas: [] };
  }
}

export async function listarTrajetosRecentes() {
  const historico = await carregarHistorico();
  return historico.trajetos;
}

export async function listarLinhasRecentes() {
  const historico = await carregarHistorico();
  return historico.linhas;
}

export function mesclarTrajetosRecentes(locais = [], remotos = [], limite = LIMITE_ITENS) {
  const vistos = new Set();
  const resultado = [];
  const combinados = [...(Array.isArray(locais) ? locais : []), ...(Array.isArray(remotos) ? remotos : [])];

  for (const item of combinados) {
    if (!item || !item.origem || !item.destino) continue;
    const origem = String(item.origem).trim();
    const destino = String(item.destino).trim();
    if (!origem || !destino) continue;

    const chave = `${normalizarChave(origem)}||${normalizarChave(destino)}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    resultado.push({
      origem,
      destino,
      realizadaEm: item.realizadaEm || item.realizada_em || null,
    });

    if (resultado.length >= limite) break;
  }

  return resultado;
}

export async function salvarTrajetoRecenteLocal(origem, destino) {
  const origemLimpa = String(origem || '').trim();
  const destinoLimpo = String(destino || '').trim();
  if (!origemLimpa || !destinoLimpo) {
    return listarTrajetosRecentes();
  }

  const historico = await carregarHistorico();
  const novoItem = {
    origem: origemLimpa,
    destino: destinoLimpo,
    realizadaEm: new Date().toISOString(),
  };

  const trajetosAtualizados = mesclarTrajetosRecentes([novoItem], historico.trajetos, LIMITE_ITENS);
  const novoHistorico = { ...historico, trajetos: trajetosAtualizados };

  try {
    await AsyncStorage.setItem(CHAVE_BUSCAS_RECENTES, JSON.stringify(novoHistorico));
  } catch (_err) {
    // Mantém funcionamento mesmo se o armazenamento falhar
  }

  return trajetosAtualizados;
}

export async function salvarLinhaRecenteLocal({ termo = '', linhaId = null, codigo = '', nome = '' }) {
  const termoLimpo = String(termo || '').trim();
  const codigoLimpo = String(codigo || '').trim();
  const nomeLimpo = String(nome || '').trim();
  const idLimpo = linhaId !== null && linhaId !== undefined && String(linhaId).trim() !== ''
    ? String(linhaId)
    : null;

  if (!termoLimpo && !idLimpo && !codigoLimpo) {
    return listarLinhasRecentes();
  }

  const historico = await carregarHistorico();
  const novoItem = {
    termo: termoLimpo || codigoLimpo || nomeLimpo,
    linhaId: idLimpo,
    codigo: codigoLimpo || null,
    nome: nomeLimpo || null,
    realizadaEm: new Date().toISOString(),
  };

  const chaveNovo = idLimpo
    ? `id:${idLimpo}`
    : `termo:${normalizarChave(novoItem.termo)}`;

  const restantes = historico.linhas.filter((item) => {
    if (!item) return false;
    const chaveItem = item.linhaId
      ? `id:${String(item.linhaId)}`
      : `termo:${normalizarChave(item.termo)}`;
    return chaveItem !== chaveNovo;
  });

  const linhasAtualizadas = [novoItem, ...restantes].slice(0, LIMITE_ITENS);
  const novoHistorico = { ...historico, linhas: linhasAtualizadas };

  try {
    await AsyncStorage.setItem(CHAVE_BUSCAS_RECENTES, JSON.stringify(novoHistorico));
  } catch (_err) {
    // Mantém funcionamento mesmo se o armazenamento falhar
  }

  return linhasAtualizadas;
}

export async function obterUsuarioLogadoId() {
  try {
    const bruto = await AsyncStorage.getItem('@rotasdf_usuario');
    if (!bruto) return null;
    const usuario = JSON.parse(bruto);
    return usuario && usuario.id !== undefined && usuario.id !== null ? usuario.id : null;
  } catch (_err) {
    return null;
  }
}
