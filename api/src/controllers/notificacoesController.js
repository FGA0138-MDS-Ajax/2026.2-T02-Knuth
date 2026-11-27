const service = require('../services/notificacoesService');

const CODIGOS_DE_ERRO = { 400: 'BAD_REQUEST', 404: 'NOT_FOUND' };

const responderErro = (res, error) => {
  const codigo = CODIGOS_DE_ERRO[error.status];
  if (codigo) {
    return res.status(error.status).json({ erro: codigo, detalhes: error.message });
  }
  return res.status(500).json({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao processar notificações.' });
};

const apenasPassageiro = (req, res) => {
  if (!req.usuario || req.usuario.tipo !== 'PASSAGEIRO') {
    res.status(403).json({
      erro: 'FORBIDDEN',
      detalhes: 'Apenas passageiros cadastrados podem usar notificações.',
    });
    return false;
  }
  return true;
};

const listar = async (req, res) => {
  if (!apenasPassageiro(req, res)) return;

  try {
    const notificacoes = await service.listar(req.usuario.id);
    return res.status(200).json(notificacoes);
  } catch (error) {
    return responderErro(res, error);
  }
};

const contarNaoLidas = async (req, res) => {
  if (!apenasPassageiro(req, res)) return;

  try {
    const naoLidas = await service.contarNaoLidas(req.usuario.id);
    return res.status(200).json({ naoLidas });
  } catch (error) {
    return responderErro(res, error);
  }
};

const marcarComoLida = async (req, res) => {
  if (!apenasPassageiro(req, res)) return;

  try {
    const notificacao = await service.marcarComoLida(req.params.id, req.usuario.id);
    return res.status(200).json(notificacao);
  } catch (error) {
    return responderErro(res, error);
  }
};

module.exports = { listar, contarNaoLidas, marcarComoLida };
