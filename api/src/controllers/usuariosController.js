const usuariosService = require('../services/usuariosService');

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
}

module.exports = new UsuariosController();