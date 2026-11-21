const favoritosRepository = require('../repositories/favoritosRepository');

const TIPOS_VALIDOS = ['LINHA', 'PARADA', 'TRAJETO'];

function falha(mensagem, status = 400) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function texto(valor) {
  if (typeof valor === 'string' || typeof valor === 'number') {
    return String(valor).trim();
  }
  return '';
}

function validar(dados = {}) {
  const tipo = texto(dados.tipo).toUpperCase();

  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw falha('Tipo de favorito inválido.');
  }

  if (tipo === 'LINHA') {
    const linhaId = texto(dados.linhaId);
    if (!linhaId) throw falha('Informe a linha do favorito.');
    return { tipo, linhaId };
  }

  if (tipo === 'PARADA') {
    const paradaId = texto(dados.paradaId);
    if (!paradaId) throw falha('Informe a parada do favorito.');
    return { tipo, paradaId };
  }

  const origem = texto(dados.origem);
  const destino = texto(dados.destino);
  if (!origem || !destino) throw falha('Informe origem e destino do trajeto.');
  return { tipo, origem, destino };
}

async function listar(usuarioId) {
  return favoritosRepository.listar(usuarioId);
}

async function adicionar(usuarioId, dados) {
  const favorito = validar(dados);

  let criado;
  try {
    criado = await favoritosRepository.adicionar({ usuarioId, ...favorito });
  } catch (erro) {
    if (erro && erro.code === '23503') {
      throw falha('Linha ou parada não encontrada.', 404);
    }
    throw erro;
  }

  if (!criado) {
    throw falha('Este item já está nos favoritos.', 409);
  }
  return criado;
}

async function remover(usuarioId, id) {
  if (!/^\d+$/.test(String(id)) || Number(id) === 0) {
    throw falha('ID inválido.');
  }

  const removido = await favoritosRepository.remover(Number(id), usuarioId);
  if (!removido) {
    throw falha('Favorito não encontrado.', 404);
  }
}

module.exports = { listar, adicionar, remover };
