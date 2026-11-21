const service = require('../services/favoritosService');

const CODIGOS_DE_ERRO = { 400: 'BAD_REQUEST', 404: 'NOT_FOUND', 409: 'CONFLICT' };

const responderErro = (res, error) => {
  const codigo = CODIGOS_DE_ERRO[error.status];
  if (codigo) {
    return res.status(error.status).json({ erro: codigo, detalhes: error.message });
  }
  return res.status(500).json({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao processar favoritos.' });
};

const apenasPassageiro = (req, res) => {
  if (!req.usuario || req.usuario.tipo !== 'PASSAGEIRO') {
    res.status(403).json({
      erro: 'FORBIDDEN',
      detalhes: 'Apenas passageiros cadastrados podem usar favoritos.',
    });
    return false;
  }
  return true;
};

const listar = async (req, res) => {
  if (!apenasPassageiro(req, res)) return;

  try {
    const favoritos = await service.listar(req.usuario.id);
    return res.status(200).json(favoritos);
  } catch (error) {
    return responderErro(res, error);
  }
};

const adicionar = async (req, res) => {
  if (!apenasPassageiro(req, res)) return;

  try {
    const favorito = await service.adicionar(req.usuario.id, req.body);
    return res.status(201).json(favorito);
  } catch (error) {
    return responderErro(res, error);
  }
};

const remover = async (req, res) => {
  if (!apenasPassageiro(req, res)) return;

  try {
    await service.remover(req.usuario.id, req.params.id);
    return res.status(200).json({ mensagem: 'Favorito removido.' });
  } catch (error) {
    return responderErro(res, error);
  }
};

module.exports = { listar, adicionar, remover };