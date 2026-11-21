jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));
jest.mock('../repositories/usuariosRepository', () => ({
  buscarPorEmail: jest.fn(),
  criar: jest.fn(),
  buscarPorId: jest.fn(),
  atualizarSenha: jest.fn(),
  excluir: jest.fn(),
}));
jest.mock('../repositories/recuperacaoSenhaRepository', () => ({
  invalidarPendentes: jest.fn(),
  criar: jest.fn(),
  buscarAtiva: jest.fn(),
  registrarTentativa: jest.fn(),
  marcarUsada: jest.fn(),
}));
jest.mock('../services/emailService', () => ({
  enviarCodigoRecuperacao: jest.fn(),
}));

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuariosRepository');
const recuperacaoSenhaRepository = require('../repositories/recuperacaoSenhaRepository');
const emailService = require('../services/emailService');
const usuariosService = require('../services/usuariosService');

describe('UsuariosService', () => {
  const SECRET_ORIGINAL = process.env.JWT_SECRET;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    if (SECRET_ORIGINAL === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = SECRET_ORIGINAL;
    }
  });

  describe('cadastrar', () => {
    beforeEach(() => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hash-gerado');
    });

    it.each([
      ['nome', [undefined, 'bia@ex.com', 'senha123']],
      ['email', ['Bia', undefined, 'senha123']],
      ['senha', ['Bia', 'bia@ex.com', undefined]],
    ])('exige %s', async (_campo, args) => {
      await expect(usuariosService.cadastrar(...args)).rejects.toThrow(
        'Nome, email e senha são obrigatórios.'
      );
      expect(usuariosRepository.criar).not.toHaveBeenCalled();
    });

    it('rejeita email já cadastrado', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue({ id: 1 });

      await expect(
        usuariosService.cadastrar('Bia', 'bia@ex.com', 'senha123')
      ).rejects.toThrow('Este email já está cadastrado.');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usuariosRepository.criar).not.toHaveBeenCalled();
    });

    it('gera o hash da senha (bcrypt, 10 rounds) e cria o usuário com o hash', async () => {
      const criado = { id: 2, nome: 'Bia', email: 'bia@ex.com' };
      usuariosRepository.criar.mockResolvedValue(criado);

      const resultado = await usuariosService.cadastrar('Bia', 'bia@ex.com', 'senha123');

      expect(usuariosRepository.buscarPorEmail).toHaveBeenCalledWith('bia@ex.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 10);
      expect(usuariosRepository.criar).toHaveBeenCalledWith('Bia', 'bia@ex.com', 'hash-gerado');
      expect(resultado).toBe(criado);
    });
  });

  describe('login', () => {
    const usuarioBanco = {
      id: 5,
      nome: 'Bia',
      email: 'bia@ex.com',
      tipo: 'PASSAGEIRO',
      senha_hash: 'hash-do-banco',
    };

    it('lança erro genérico quando o email não existe', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(null);

      await expect(usuariosService.login('x@ex.com', 'senha123')).rejects.toThrow(
        'Email ou senha incorretos.'
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('lança a mesma mensagem genérica quando a senha está errada', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(usuarioBanco);
      bcrypt.compare.mockResolvedValue(false);

      await expect(usuariosService.login('bia@ex.com', 'errada')).rejects.toThrow(
        'Email ou senha incorretos.'
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('errada', 'hash-do-banco');
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('retorna usuário (sem senha_hash) e token quando as credenciais são válidas', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(usuarioBanco);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token-jwt');

      const resultado = await usuariosService.login('bia@ex.com', 'senha123');

      expect(resultado).toEqual({
        usuario: { id: 5, nome: 'Bia', email: 'bia@ex.com', tipo: 'PASSAGEIRO' },
        token: 'token-jwt',
      });
    });

    it('assina o token com id e tipo, usando JWT_SECRET e validade de 7 dias', async () => {
      process.env.JWT_SECRET = 'segredo-de-teste';
      usuariosRepository.buscarPorEmail.mockResolvedValue(usuarioBanco);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token-jwt');

      await usuariosService.login('bia@ex.com', 'senha123');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 5, tipo: 'PASSAGEIRO' },
        'segredo-de-teste',
        { expiresIn: '7d' }
      );
    });

    it('usa o segredo padrão quando JWT_SECRET não está definido', async () => {
      delete process.env.JWT_SECRET;
      usuariosRepository.buscarPorEmail.mockResolvedValue(usuarioBanco);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token-jwt');

      await usuariosService.login('bia@ex.com', 'senha123');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 5, tipo: 'PASSAGEIRO' },
        'chave_secreta_padrao',
        { expiresIn: '7d' }
      );
    });
  });
});

// ---------- RF16: recuperação de senha e exclusão de conta ----------
describe('UsuariosService - RF16', () => {
  const EXPOR_ORIGINAL = process.env.RECUPERACAO_SENHA_EXPOR_CODIGO;
  const USUARIO = {
    id: 7,
    nome: 'Bia',
    email: 'bia@ex.com',
    tipo: 'PASSAGEIRO',
    senha_hash: 'hash-da-senha',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.RECUPERACAO_SENHA_EXPOR_CODIGO;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (EXPOR_ORIGINAL === undefined) {
      delete process.env.RECUPERACAO_SENHA_EXPOR_CODIGO;
    } else {
      process.env.RECUPERACAO_SENHA_EXPOR_CODIGO = EXPOR_ORIGINAL;
    }
  });

  describe('solicitarRecuperacaoSenha', () => {
    const MENSAGEM = 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.';

    it('exige o e-mail (status 400)', async () => {
      await expect(usuariosService.solicitarRecuperacaoSenha('')).rejects.toMatchObject({
        message: 'O email é obrigatório.',
        status: 400,
      });
      expect(usuariosRepository.buscarPorEmail).not.toHaveBeenCalled();
    });

    it('responde a mesma mensagem genérica quando o e-mail não existe, sem gerar código', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(null);

      const resultado = await usuariosService.solicitarRecuperacaoSenha('x@ex.com');

      expect(resultado).toEqual({ mensagem: MENSAGEM });
      expect(recuperacaoSenhaRepository.criar).not.toHaveBeenCalled();
      expect(emailService.enviarCodigoRecuperacao).not.toHaveBeenCalled();
    });

    it('gera código de 6 dígitos, salva só o hash, invalida os anteriores e envia o e-mail', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(USUARIO);
      jest.spyOn(crypto, 'randomInt').mockReturnValue(4321);
      bcrypt.hash.mockResolvedValue('hash-do-codigo');
      const agora = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(agora);

      const resultado = await usuariosService.solicitarRecuperacaoSenha('bia@ex.com');

      expect(bcrypt.hash).toHaveBeenCalledWith('004321', 10);
      expect(recuperacaoSenhaRepository.invalidarPendentes).toHaveBeenCalledWith(7);
      expect(recuperacaoSenhaRepository.criar).toHaveBeenCalledWith(
        7,
        'hash-do-codigo',
        new Date(agora + 15 * 60 * 1000)
      );
      expect(emailService.enviarCodigoRecuperacao).toHaveBeenCalledWith(
        'bia@ex.com',
        'Bia',
        '004321',
        15
      );
      expect(resultado).toEqual({ mensagem: MENSAGEM });
    });

    it('invalida os códigos pendentes antes de criar o novo', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(USUARIO);
      bcrypt.hash.mockResolvedValue('hash');

      await usuariosService.solicitarRecuperacaoSenha('bia@ex.com');

      const ordemInvalidar = recuperacaoSenhaRepository.invalidarPendentes.mock.invocationCallOrder[0];
      const ordemCriar = recuperacaoSenhaRepository.criar.mock.invocationCallOrder[0];
      expect(ordemInvalidar).toBeLessThan(ordemCriar);
    });

    it('só devolve o código na resposta quando RECUPERACAO_SENHA_EXPOR_CODIGO=true', async () => {
      process.env.RECUPERACAO_SENHA_EXPOR_CODIGO = 'true';
      usuariosRepository.buscarPorEmail.mockResolvedValue(USUARIO);
      jest.spyOn(crypto, 'randomInt').mockReturnValue(123456);
      bcrypt.hash.mockResolvedValue('hash');

      const resultado = await usuariosService.solicitarRecuperacaoSenha('bia@ex.com');

      expect(resultado).toEqual({ mensagem: MENSAGEM, codigoDev: '123456' });
    });
  });

  describe('redefinirSenha', () => {
    const RECUPERACAO = { id: 30, usuario_id: 7, codigo_hash: 'hash-do-codigo', tentativas: 0 };

    it.each([
      ['email', [undefined, '123456', 'novaSenha']],
      ['código', ['bia@ex.com', undefined, 'novaSenha']],
      ['nova senha', ['bia@ex.com', '123456', undefined]],
    ])('exige %s', async (_campo, args) => {
      await expect(usuariosService.redefinirSenha(...args)).rejects.toMatchObject({
        message: 'Email, código e nova senha são obrigatórios.',
        status: 400,
      });
      expect(usuariosRepository.atualizarSenha).not.toHaveBeenCalled();
    });

    it('exige nova senha com pelo menos 6 caracteres', async () => {
      await expect(
        usuariosService.redefinirSenha('bia@ex.com', '123456', '12345')
      ).rejects.toMatchObject({
        message: 'A nova senha deve ter pelo menos 6 caracteres.',
        status: 400,
      });
      expect(usuariosRepository.buscarPorEmail).not.toHaveBeenCalled();
    });

    it('recusa com mensagem genérica quando o e-mail não existe', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(null);

      await expect(
        usuariosService.redefinirSenha('x@ex.com', '123456', 'novaSenha')
      ).rejects.toMatchObject({ message: 'Código inválido ou expirado.', status: 400 });
    });

    it('recusa quando não há código ativo (expirado ou já usado)', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(USUARIO);
      recuperacaoSenhaRepository.buscarAtiva.mockResolvedValue(null);

      await expect(
        usuariosService.redefinirSenha('bia@ex.com', '123456', 'novaSenha')
      ).rejects.toMatchObject({ message: 'Código inválido ou expirado.', status: 400 });
      expect(recuperacaoSenhaRepository.buscarAtiva).toHaveBeenCalledWith(7);
      expect(usuariosRepository.atualizarSenha).not.toHaveBeenCalled();
    });

    it('registra a tentativa e recusa quando o código está errado', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(USUARIO);
      recuperacaoSenhaRepository.buscarAtiva.mockResolvedValue(RECUPERACAO);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        usuariosService.redefinirSenha('bia@ex.com', '999999', 'novaSenha')
      ).rejects.toMatchObject({ message: 'Código inválido ou expirado.', status: 400 });
      expect(bcrypt.compare).toHaveBeenCalledWith('999999', 'hash-do-codigo');
      expect(recuperacaoSenhaRepository.registrarTentativa).toHaveBeenCalledWith(30);
      expect(usuariosRepository.atualizarSenha).not.toHaveBeenCalled();
    });

    it('bloqueia e invalida o código após 5 tentativas erradas', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(USUARIO);
      recuperacaoSenhaRepository.buscarAtiva.mockResolvedValue({ ...RECUPERACAO, tentativas: 5 });

      await expect(
        usuariosService.redefinirSenha('bia@ex.com', '123456', 'novaSenha')
      ).rejects.toMatchObject({
        message: 'Número máximo de tentativas excedido. Solicite um novo código.',
        status: 400,
      });
      expect(recuperacaoSenhaRepository.marcarUsada).toHaveBeenCalledWith(30);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('com código válido, grava o hash da nova senha e marca o código como usado', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue(USUARIO);
      recuperacaoSenhaRepository.buscarAtiva.mockResolvedValue(RECUPERACAO);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hash-nova-senha');

      const resultado = await usuariosService.redefinirSenha('bia@ex.com', 123456, 'novaSenha');

      expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'hash-do-codigo');
      expect(bcrypt.hash).toHaveBeenCalledWith('novaSenha', 10);
      expect(usuariosRepository.atualizarSenha).toHaveBeenCalledWith(7, 'hash-nova-senha');
      expect(recuperacaoSenhaRepository.marcarUsada).toHaveBeenCalledWith(30);
      expect(resultado).toEqual({ mensagem: 'Senha redefinida com sucesso.' });
    });
  });

  describe('excluirConta', () => {
    it('exige a senha de confirmação', async () => {
      await expect(usuariosService.excluirConta(7, '')).rejects.toMatchObject({
        message: 'Informe sua senha para confirmar a exclusão.',
        status: 400,
      });
      expect(usuariosRepository.excluir).not.toHaveBeenCalled();
    });

    it('responde 404 quando o usuário do token não existe mais', async () => {
      usuariosRepository.buscarPorId.mockResolvedValue(null);

      await expect(usuariosService.excluirConta(7, 'senha123')).rejects.toMatchObject({
        message: 'Usuário não encontrado.',
        status: 404,
      });
    });

    it('não permite que administradores excluam a própria conta (403)', async () => {
      usuariosRepository.buscarPorId.mockResolvedValue({ ...USUARIO, tipo: 'ADMIN' });

      await expect(usuariosService.excluirConta(7, 'senha123')).rejects.toMatchObject({
        message: 'A exclusão da própria conta está disponível apenas para passageiros.',
        status: 403,
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(usuariosRepository.excluir).not.toHaveBeenCalled();
    });

    it('recusa com 401 quando a senha está incorreta', async () => {
      usuariosRepository.buscarPorId.mockResolvedValue(USUARIO);
      bcrypt.compare.mockResolvedValue(false);

      await expect(usuariosService.excluirConta(7, 'errada')).rejects.toMatchObject({
        message: 'Senha incorreta.',
        status: 401,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('errada', 'hash-da-senha');
      expect(usuariosRepository.excluir).not.toHaveBeenCalled();
    });

    it('exclui a conta quando a senha confere', async () => {
      usuariosRepository.buscarPorId.mockResolvedValue(USUARIO);
      bcrypt.compare.mockResolvedValue(true);

      const resultado = await usuariosService.excluirConta(7, 'senha123');

      expect(usuariosRepository.buscarPorId).toHaveBeenCalledWith(7);
      expect(usuariosRepository.excluir).toHaveBeenCalledWith(7);
      expect(resultado).toEqual({ mensagem: 'Conta excluída com sucesso.' });
    });
  });
});
