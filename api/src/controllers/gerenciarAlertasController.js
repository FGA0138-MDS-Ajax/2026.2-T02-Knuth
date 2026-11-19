const service = require('../services/gerenciarAlertasService');

const responderErro = (res, error) => {
  if (error.message === 'Alerta não encontrado.') {
    return res.status(404).json({ erro: 'NOT_FOUND', detalhes: error.message });
  }
  return res.status(400).json({ erro: 'BAD_REQUEST', detalhes: error.message });
};

const listar = async (req, res) => {
  try {
    const alertas = await service.listar();
    return res.status(200).json(alertas);
  } catch (error) {
    return responderErro(res, error);
  }
};

const criar = async (req, res) => {
  try {
    const alerta = await service.criar(req.body);
    return res.status(201).json(alerta);
  } catch (error) {
    return responderErro(res, error);
  }
};

const encerrar = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: 'BAD_REQUEST', detalhes: 'ID inválido.' });
  }

  try {
    await service.encerrar(id);
    return res.status(200).json({ mensagem: 'Alerta encerrado.' });
  } catch (error) {
    return responderErro(res, error);
  }
};

const excluir = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: 'BAD_REQUEST', detalhes: 'ID inválido.' });
  }

  try {
    await service.excluir(id);
    return res.status(200).json({ mensagem: 'Alerta excluído.' });
  } catch (error) {
    return responderErro(res, error);
  }
};
module.exports = { listar, criar, encerrar, excluir };