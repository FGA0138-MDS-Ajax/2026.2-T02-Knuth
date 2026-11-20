jest.mock('bcrypt', () => ({ hash: jest.fn() }));
jest.mock('../repositories/usuariosRepository', () => ({
  buscarPorEmail: jest.fn(),
}));
jest.mock('../repositories/adminRepository', () => ({
  criar: jest.fn(),
}));

const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuariosRepository');
const adminRepository = require('../repositories/adminRepository');
const adminService = require('../services/adminService');

describe('AdminService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    usuariosRepository.buscarPorEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hash-gerado');
  });

  describe('criarAdministrador', () => {
    it.each([
      ['nome', [undefined, 'ana@ex.com', 'senha123']],
      ['email', ['Ana', undefined, 'senha123']],
      ['senha', ['Ana', 'ana@ex.com', undefined]],
      ['nome vazio', ['', 'ana@ex.com', 'senha123']],
    ])('exige %s', async (_campo, args) => {
      await expect(adminService.criarAdministrador(...args)).rejects.toThrow(
        'Nome, email e senha são obrigatórios.'
      );
      expect(adminRepository.criar).not.toHaveBeenCalled();
    });

    it('rejeita senha com menos de 6 caracteres', async () => {
      await expect(
        adminService.criarAdministrador('Ana', 'ana@ex.com', '12345')
      ).rejects.toThrow('A senha deve ter pelo menos 6 caracteres.');
      expect(adminRepository.criar).not.toHaveBeenCalled();
    });

    it('aceita senha com exatamente 6 caracteres', async () => {
      adminRepository.criar.mockResolvedValue({ id: 1 });

      await expect(
        adminService.criarAdministrador('Ana', 'ana@ex.com', '123456')
      ).resolves.toEqual({ id: 1 });
    });

    it('rejeita email já cadastrado', async () => {
      usuariosRepository.buscarPorEmail.mockResolvedValue({ id: 10, email: 'ana@ex.com' });

      await expect(
        adminService.criarAdministrador('Ana', 'ana@ex.com', 'senha123')
      ).rejects.toThrow('Este email já está cadastrado.');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(adminRepository.criar).not.toHaveBeenCalled();
    });

    it('verifica a existência do email informado', async () => {
      adminRepository.criar.mockResolvedValue({ id: 1 });

      await adminService.criarAdministrador('Ana', 'ana@ex.com', 'senha123');

      expect(usuariosRepository.buscarPorEmail).toHaveBeenCalledWith('ana@ex.com');
    });

    it('gera o hash da senha (bcrypt, 10 rounds) e cria o administrador com o hash', async () => {
      const criado = { id: 1, nome: 'Ana', email: 'ana@ex.com', tipo: 'ADMIN' };
      adminRepository.criar.mockResolvedValue(criado);

      const resultado = await adminService.criarAdministrador('Ana', 'ana@ex.com', 'senha123');

      expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 10);
      expect(adminRepository.criar).toHaveBeenCalledWith('Ana', 'ana@ex.com', 'hash-gerado');
      expect(resultado).toBe(criado);
    });

    it('nunca envia a senha em texto puro ao repositório', async () => {
      adminRepository.criar.mockResolvedValue({ id: 1 });

      await adminService.criarAdministrador('Ana', 'ana@ex.com', 'senha123');

      const argumentos = adminRepository.criar.mock.calls[0];
      expect(argumentos).not.toContain('senha123');
    });
  });
});
