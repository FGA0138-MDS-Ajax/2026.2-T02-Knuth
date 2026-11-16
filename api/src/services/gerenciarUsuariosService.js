const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuariosRepository');
const repo = require('../repositories/gerenciarUsuariosRepository');

const TIPOS_VALIDOS = ['ADMIN', 'PASSAGEIRO'];

class GerenciarUsuariosService {
  async listar(tipo) {
    return await repo.listar(tipo);
  }

  async atualizar(id, dados, solicitanteId) {
    const usuario = await repo.buscarPorId(id);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    const { nome, email, senha } = dados;
    const tipo = dados.tipo || usuario.tipo;

    if (!nome || !email) {
      throw new Error('Nome e email são obrigatórios.');
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
      throw new Error('Tipo inválido.');
    }

    if (senha && senha.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }

    const outroUsuario = await usuariosRepository.buscarPorEmail(email);
    if (outroUsuario && outroUsuario.id !== id) {
      throw new Error('Este email já está cadastrado.');
    }

    if (usuario.tipo === 'ADMIN' && tipo !== 'ADMIN') {
      if (id === solicitanteId) {
        throw new Error('Você não pode rebaixar a si mesma.');
      }
      const totalAdmins = await repo.contarAdmins();
      if (totalAdmins <= 1) {
        throw new Error('Não é possível remover o último administrador.');
      }
    }

    const senhaHash = senha ? await bcrypt.hash(senha, 10) : null;
    return await repo.atualizar(id, nome, email, senhaHash, tipo);
  }

  async excluir(id, solicitanteId) {
    const usuario = await repo.buscarPorId(id);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    if (id === solicitanteId) {
      throw new Error('Você não pode excluir a própria conta.');
    }

    if (usuario.tipo === 'ADMIN') {
      const totalAdmins = await repo.contarAdmins();
      if (totalAdmins <= 1) {
        throw new Error('Não é possível excluir o último administrador.');
      }
    }

    await repo.excluir(id);
  }
}

module.exports = new GerenciarUsuariosService();