const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuariosRepository');

class UsuariosService {
  async cadastrar(nome, email, senha) {
    if (!nome || !email || !senha) {
      throw new Error('Nome, email e senha são obrigatórios.');
    }

    const usuarioExistente = await usuariosRepository.buscarPorEmail(email);
    if (usuarioExistente) {
      throw new Error('Este email já está cadastrado.');
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    return await usuariosRepository.criar(nome, email, senhaHash);
  }

  async login(email, senha) {
    const usuario = await usuariosRepository.buscarPorEmail(email);
    if (!usuario) {
      throw new Error('Email ou senha incorretos.');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      throw new Error('Email ou senha incorretos.');
    }

    const token = jwt.sign(
      { id: usuario.id, tipo: usuario.tipo }, 
      process.env.JWT_SECRET || 'chave_secreta_padrao', 
      { expiresIn: '7d' }
    );

    return { 
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo }, 
      token 
    };
  }
}

module.exports = new UsuariosService();