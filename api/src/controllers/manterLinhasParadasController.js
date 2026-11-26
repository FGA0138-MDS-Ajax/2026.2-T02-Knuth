const linhasService = require('../services/linhasService');
const paradasService = require('../services/paradasService');

const CODIGOS_ERRO = { 400: 'BAD_REQUEST', 404: 'NOT_FOUND', 409: 'CONFLICT' };

const responderErro = (res, error, mensagemInterna) => {
  if (error.status && CODIGOS_ERRO[error.status]) {
    return res.status(error.status).json({ erro: CODIGOS_ERRO[error.status], detalhes: error.message });
  }
  console.error(mensagemInterna, error);
  return res.status(500).json({ erro: 'INTERNAL_ERROR', detalhes: mensagemInterna });
};

// RF23 - Manter linhas, paradas e horários (as gravações passam pelos services de Linhas e Paradas)
const criarLinha = async (req, res) => {
  try {
    const linha = await linhasService.criarLinha(req.body || {});
    return res.status(201).json(linha);
  } catch (error) {
    return responderErro(res, error, 'Erro interno ao incluir a linha.');
  }
};

const editarLinha = async (req, res) => {
  try {
    const linha = await linhasService.editarLinha(req.params.id, req.body || {});
    return res.status(200).json(linha);
  } catch (error) {
    return responderErro(res, error, 'Erro interno ao alterar a linha.');
  }
};

const excluirLinha = async (req, res) => {
  try {
    await linhasService.excluirLinha(req.params.id);
    return res.status(200).json({ mensagem: 'Linha excluída.' });
  } catch (error) {
    return responderErro(res, error, 'Erro interno ao excluir a linha.');
  }
};

const obterParada = async (req, res) => {
  try {
    const parada = await paradasService.obterParada(req.params.id);
    return res.status(200).json(parada);
  } catch (error) {
    return responderErro(res, error, 'Erro interno ao consultar a parada.');
  }
};

const criarParada = async (req, res) => {
  try {
    const parada = await paradasService.criarParada(req.body || {});
    return res.status(201).json(parada);
  } catch (error) {
    return responderErro(res, error, 'Erro interno ao incluir a parada.');
  }
};

const editarParada = async (req, res) => {
  try {
    const parada = await paradasService.editarParada(req.params.id, req.body || {});
    return res.status(200).json(parada);
  } catch (error) {
    return responderErro(res, error, 'Erro interno ao alterar a parada.');
  }
};

const excluirParada = async (req, res) => {
  try {
    await paradasService.excluirParada(req.params.id);
    return res.status(200).json({ mensagem: 'Parada excluída.' });
  } catch (error) {
    return responderErro(res, error, 'Erro interno ao excluir a parada.');
  }
};

module.exports = {
  criarLinha,
  editarLinha,
  excluirLinha,
  obterParada,
  criarParada,
  editarParada,
  excluirParada
};
