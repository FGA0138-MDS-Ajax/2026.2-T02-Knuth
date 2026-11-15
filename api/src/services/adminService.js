const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuariosRepository');
const adminRepository = require('../repositories/adminRepository');

class AdminService {
  async criarAdministrador(nome, email, senha) {
    if (!nome || !email || !senha) {
      throw new Error('Nome, email e senha são obrigatórios.');
    }

    if (senha.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }

    const usuarioExistente = await usuariosRepository.buscarPorEmail(email);
    if (usuarioExistente) {
      throw new Error('Este email já está cadastrado.');
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    return await adminRepository.criar(nome, email, senhaHash);
  }
}

module.exports = new AdminService();