const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuariosRepository');
const recuperacaoSenhaRepository = require('../repositories/recuperacaoSenhaRepository');
const emailService = require('./emailService');

const VALIDADE_CODIGO_MINUTOS = 15;
const MAX_TENTATIVAS_CODIGO = 5;
const TAMANHO_MINIMO_SENHA = 6;

const MSG_RECUPERACAO_ENVIADA =
  'Se o e-mail estiver cadastrado, você receberá um código de recuperação.';
const MSG_CODIGO_INVALIDO = 'Código inválido ou expirado.';

function erroComStatus(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function gerarCodigo() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

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

  // RF16 - Solicita um código de recuperação de senha.
  // A resposta é sempre a mesma, exista ou não o e-mail, para não revelar contas cadastradas.
  async solicitarRecuperacaoSenha(email) {
    if (!email) {
      throw erroComStatus('O email é obrigatório.', 400);
    }

    const resposta = { mensagem: MSG_RECUPERACAO_ENVIADA };

    const usuario = await usuariosRepository.buscarPorEmail(email);
    if (!usuario) {
      return resposta;
    }

    const codigo = gerarCodigo();
    const codigoHash = await bcrypt.hash(codigo, 10);
    const expiraEm = new Date(Date.now() + VALIDADE_CODIGO_MINUTOS * 60 * 1000);

    await recuperacaoSenhaRepository.invalidarPendentes(usuario.id);
    await recuperacaoSenhaRepository.criar(usuario.id, codigoHash, expiraEm);
    await emailService.enviarCodigoRecuperacao(
      usuario.email,
      usuario.nome,
      codigo,
      VALIDADE_CODIGO_MINUTOS
    );

    // Apenas para desenvolvimento/testes locais, enquanto não há provedor de e-mail.
    if (process.env.RECUPERACAO_SENHA_EXPOR_CODIGO === 'true') {
      resposta.codigoDev = codigo;
    }

    return resposta;
  }

  // RF16 - Redefine a senha a partir do código de recuperação.
  async redefinirSenha(email, codigo, novaSenha) {
    if (!email || !codigo || !novaSenha) {
      throw erroComStatus('Email, código e nova senha são obrigatórios.', 400);
    }

    if (novaSenha.length < TAMANHO_MINIMO_SENHA) {
      throw erroComStatus(
        `A nova senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`,
        400
      );
    }

    const usuario = await usuariosRepository.buscarPorEmail(email);
    if (!usuario) {
      throw erroComStatus(MSG_CODIGO_INVALIDO, 400);
    }

    const recuperacao = await recuperacaoSenhaRepository.buscarAtiva(usuario.id);
    if (!recuperacao) {
      throw erroComStatus(MSG_CODIGO_INVALIDO, 400);
    }

    if (recuperacao.tentativas >= MAX_TENTATIVAS_CODIGO) {
      await recuperacaoSenhaRepository.marcarUsada(recuperacao.id);
      throw erroComStatus(
        'Número máximo de tentativas excedido. Solicite um novo código.',
        400
      );
    }

    const codigoValido = await bcrypt.compare(String(codigo), recuperacao.codigo_hash);
    if (!codigoValido) {
      await recuperacaoSenhaRepository.registrarTentativa(recuperacao.id);
      throw erroComStatus(MSG_CODIGO_INVALIDO, 400);
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await usuariosRepository.atualizarSenha(usuario.id, senhaHash);
    await recuperacaoSenhaRepository.marcarUsada(recuperacao.id);

    return { mensagem: 'Senha redefinida com sucesso.' };
  }

  // RF16 - Exclusão da própria conta pelo passageiro (exige confirmação da senha).
  async excluirConta(usuarioId, senha) {
    if (!senha) {
      throw erroComStatus('Informe sua senha para confirmar a exclusão.', 400);
    }

    const usuario = await usuariosRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw erroComStatus('Usuário não encontrado.', 404);
    }

    if (usuario.tipo === 'ADMIN') {
      throw erroComStatus(
        'A exclusão da própria conta está disponível apenas para passageiros.',
        403
      );
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      throw erroComStatus('Senha incorreta.', 401);
    }

    await usuariosRepository.excluir(usuario.id);
    return { mensagem: 'Conta excluída com sucesso.' };
  }
}

module.exports = new UsuariosService();
