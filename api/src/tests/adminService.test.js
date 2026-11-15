jest.mock('bcrypt', () => ({ hash: jest.fn() }));
jest.mock('../repositories/usuariosRepository');
jest.mock('../repositories/adminRepository');

const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuariosRepository');
const adminRepository = require('../repositories/adminRepository');
const adminService = require('../services/adminService');

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Deve lançar erro se faltar nome, email ou senha', async () => {
    await expect(adminService.criarAdministrador('Maria', '', '123456'))
      .rejects.toThrow('Nome, email e senha são obrigatórios.');
    expect(adminRepository.criar).not.toHaveBeenCalled();
  });

  test('Deve lançar erro se a senha tiver menos de 6 caracteres', async () => {
    await expect(adminService.criarAdministrador('Maria', 'maria@teste.com', '123'))
      .rejects.toThrow('A senha deve ter pelo menos 6 caracteres.');
    expect(adminRepository.criar).not.toHaveBeenCalled();
  });

  test('Deve lançar erro se o email já estiver cadastrado', async () => {
    usuariosRepository.buscarPorEmail.mockResolvedValue({ id: 1, email: 'maria@teste.com' });

    await expect(adminService.criarAdministrador('Maria', 'maria@teste.com', '123456'))
      .rejects.toThrow('Este email já está cadastrado.');
    expect(adminRepository.criar).not.toHaveBeenCalled();
  });

  test('Deve criar o administrador guardando o hash da senha', async () => {
    const mockAdmin = { id: 5, nome: 'Maria', email: 'maria@teste.com', tipo: 'ADMIN' };
    usuariosRepository.buscarPorEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hash_falso');
    adminRepository.criar.mockResolvedValue(mockAdmin);

    const resultado = await adminService.criarAdministrador('Maria', 'maria@teste.com', '123456');

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(adminRepository.criar).toHaveBeenCalledWith('Maria', 'maria@teste.com', 'hash_falso');
    expect(resultado).toEqual(mockAdmin);
  });
});