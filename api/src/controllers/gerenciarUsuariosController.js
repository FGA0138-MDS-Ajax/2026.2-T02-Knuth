const service = require('../services/gerenciarUsuariosService');

function responderErro(res, error) {
  if (error.message === 'Usuário não encontrado.') {
    return res.status(404).json({ erro: 'NOT_FOUND', detalhes: error.message });
  }
  return res.status(400).json({ erro: 'BAD_REQUEST', detalhes: error.message });
}

class GerenciarUsuariosController {
  async listar(req, res) {
    try {
      const usuarios = await service.listar(req.query.tipo);
      return res.status(200).json(usuarios);
    } catch (error) {
      return responderErro(res, error);
    }
  }

  async atualizar(req, res) {
    try {
      const usuario = await service.atualizar(Number(req.params.id), req.body, req.usuario.id);
      return res.status(200).json(usuario);
    } catch (error) {
      return responderErro(res, error);
    }
  }

  async excluir(req, res) {
    try {
      await service.excluir(Number(req.params.id), req.usuario.id);
      return res.status(200).json({ mensagem: 'Usuário excluído.' });
    } catch (error) {
      return responderErro(res, error);
    }
  }
}

module.exports = new GerenciarUsuariosController();