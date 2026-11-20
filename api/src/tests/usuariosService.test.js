jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));
jest.mock('../repositories/usuariosRepository', () => ({
  buscarPorEmail: jest.fn(),
  criar: jest.fn(),
}));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuariosRepository');
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
