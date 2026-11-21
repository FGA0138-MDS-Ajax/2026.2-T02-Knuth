const usuariosService = require('../services/usuariosService');

const CODIGOS_ERRO = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
};

// Erros de regra de negócio trazem "status"; os demais são tratados como erro interno.
function responderErro(res, error, mensagemInterna) {
  if (error.status && CODIGOS_ERRO[error.status]) {
    return res.status(error.status).json({
      erro: CODIGOS_ERRO[error.status],
      detalhes: error.message,
    });
  }

  console.error(mensagemInterna, error);
  return res.status(500).json({ erro: 'INTERNAL_ERROR', detalhes: mensagemInterna });
}

class UsuariosController {
  async cadastrar(req, res) {
    try {
      const { nome, email, senha } = req.body;
      const usuario = await usuariosService.cadastrar(nome, email, senha);
      return res.status(201).json(usuario);
    } catch (error) {
      return res.status(400).json({ erro: 'BAD_REQUEST', detalhes: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, senha } = req.body;
      const dados = await usuariosService.login(email, senha);
      return res.status(200).json(dados);
    } catch (error) {
      return res.status(401).json({ erro: 'UNAUTHORIZED', detalhes: error.message });
    }
  }

  // POST /api/v1/usuarios/recuperar-senha
  async solicitarRecuperacaoSenha(req, res) {
    try {
      const { email } = req.body || {};
      const dados = await usuariosService.solicitarRecuperacaoSenha(email);
      return res.status(200).json(dados);
    } catch (error) {
      return responderErro(res, error, 'Erro interno ao solicitar a recuperação de senha.');
    }
  }

  // POST /api/v1/usuarios/redefinir-senha
  async redefinirSenha(req, res) {
    try {
      const { email, codigo, novaSenha } = req.body || {};
      const dados = await usuariosService.redefinirSenha(email, codigo, novaSenha);
      return res.status(200).json(dados);
    } catch (error) {
      return responderErro(res, error, 'Erro interno ao redefinir a senha.');
    }
  }

  // DELETE /api/v1/usuarios/me
  async excluirConta(req, res) {
    try {
      const { senha } = req.body || {};
      const dados = await usuariosService.excluirConta(req.usuario.id, senha);
      return res.status(200).json(dados);
    } catch (error) {
      return responderErro(res, error, 'Erro interno ao excluir a conta.');
    }
  }
}

module.exports = new UsuariosController();
