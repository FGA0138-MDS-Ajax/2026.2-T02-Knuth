jest.mock('bcrypt', () => ({ hash: jest.fn() }));
jest.mock('../repositories/usuariosRepository');
jest.mock('../repositories/gerenciarUsuariosRepository');

const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuariosRepository');
const repo = require('../repositories/gerenciarUsuariosRepository');
const service = require('../services/gerenciarUsuariosService');

describe('GerenciarUsuariosService', () => {
  const passageiro = { id: 7, nome: 'João', email: 'joao@teste.com', tipo: 'PASSAGEIRO' };
  const admin = { id: 1, nome: 'Admin', email: 'admin@rotasdf.com', tipo: 'ADMIN' };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listar', () => {
    test('Deve listar usuários filtrando pelo tipo', async () => {
      repo.listar.mockResolvedValue([passageiro]);

      const resultado = await service.listar('PASSAGEIRO');

      expect(repo.listar).toHaveBeenCalledWith('PASSAGEIRO');
      expect(resultado).toEqual([passageiro]);
    });
  });

  describe('atualizar', () => {
    test('Deve lançar erro se o usuário não existir', async () => {
      repo.buscarPorId.mockResolvedValue(null);

      await expect(service.atualizar(99, { nome: 'A', email: 'a@a.com' }, 1))
        .rejects.toThrow('Usuário não encontrado.');
    });

    test('Deve lançar erro se faltar nome ou email', async () => {
      repo.buscarPorId.mockResolvedValue(passageiro);

      await expect(service.atualizar(7, { nome: '', email: 'a@a.com' }, 1))
        .rejects.toThrow('Nome e email são obrigatórios.');
      expect(repo.atualizar).not.toHaveBeenCalled();
    });

    test('Deve lançar erro se o tipo for inválido', async () => {
      repo.buscarPorId.mockResolvedValue(passageiro);

      await expect(service.atualizar(7, { nome: 'João', email: 'joao@teste.com', tipo: 'DONO' }, 1))
        .rejects.toThrow('Tipo inválido.');
    });

    test('Deve lançar erro se a nova senha tiver menos de 6 caracteres', async () => {
      repo.buscarPorId.mockResolvedValue(passageiro);

      await expect(service.atualizar(7, { nome: 'João', email: 'joao@teste.com', senha: '123' }, 1))
        .rejects.toThrow('A senha deve ter pelo menos 6 caracteres.');
    });

    test('Deve lançar erro se o email já pertencer a outro usuário', async () => {
      repo.buscarPorId.mockResolvedValue(passageiro);
      usuariosRepository.buscarPorEmail.mockResolvedValue({ id: 8, email: 'outro@teste.com' });

      await expect(service.atualizar(7, { nome: 'João', email: 'outro@teste.com' }, 1))
        .rejects.toThrow('Este email já está cadastrado.');
    });

    test('Deve permitir manter o próprio email e não trocar a senha se ela não for informada', async () => {
      repo.buscarPorId.mockResolvedValue(passageiro);
      usuariosRepository.buscarPorEmail.mockResolvedValue(passageiro);
      repo.atualizar.mockResolvedValue({ ...passageiro, nome: 'João Silva' });

      await service.atualizar(7, { nome: 'João Silva', email: 'joao@teste.com' }, 1);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(repo.atualizar).toHaveBeenCalledWith(7, 'João Silva', 'joao@teste.com', null, 'PASSAGEIRO');
    });

    test('Deve guardar o hash quando uma nova senha for informada', async () => {
      repo.buscarPorId.mockResolvedValue(passageiro);
      bcrypt.hash.mockResolvedValue('hash_novo');
      repo.atualizar.mockResolvedValue(passageiro);

      await service.atualizar(7, { nome: 'João', email: 'joao@teste.com', senha: 'novasenha' }, 1);

      expect(bcrypt.hash).toHaveBeenCalledWith('novasenha', 10);
      expect(repo.atualizar).toHaveBeenCalledWith(7, 'João', 'joao@teste.com', 'hash_novo', 'PASSAGEIRO');
    });

    test('Deve permitir promover um passageiro a administrador', async () => {
      repo.buscarPorId.mockResolvedValue(passageiro);
      repo.atualizar.mockResolvedValue({ ...passageiro, tipo: 'ADMIN' });

      await service.atualizar(7, { nome: 'João', email: 'joao@teste.com', tipo: 'ADMIN' }, 1);

      expect(repo.atualizar).toHaveBeenCalledWith(7, 'João', 'joao@teste.com', null, 'ADMIN');
    });

    test('Deve impedir que o administrador rebaixe a si mesmo', async () => {
      repo.buscarPorId.mockResolvedValue(admin);

      await expect(service.atualizar(1, { nome: 'Admin', email: 'admin@rotasdf.com', tipo: 'PASSAGEIRO' }, 1))
        .rejects.toThrow('Você não pode rebaixar a si mesma.');
      expect(repo.atualizar).not.toHaveBeenCalled();
    });

    test('Deve impedir rebaixar o último administrador', async () => {
      repo.buscarPorId.mockResolvedValue(admin);
      repo.contarAdmins.mockResolvedValue(1);

      await expect(service.atualizar(1, { nome: 'Admin', email: 'admin@rotasdf.com', tipo: 'PASSAGEIRO' }, 2))
        .rejects.toThrow('Não é possível remover o último administrador.');
      expect(repo.atualizar).not.toHaveBeenCalled();
    });
  });

  describe('excluir', () => {
    test('Deve lançar erro se o usuário não existir', async () => {
      repo.buscarPorId.mockResolvedValue(null);

      await expect(service.excluir(99, 1)).rejects.toThrow('Usuário não encontrado.');
    });

    test('Deve impedir que o administrador exclua a própria conta', async () => {
      repo.buscarPorId.mockResolvedValue(admin);

      await expect(service.excluir(1, 1)).rejects.toThrow('Você não pode excluir a própria conta.');
      expect(repo.excluir).not.toHaveBeenCalled();
    });

    test('Deve impedir excluir o último administrador', async () => {
      repo.buscarPorId.mockResolvedValue(admin);
      repo.contarAdmins.mockResolvedValue(1);

      await expect(service.excluir(1, 2)).rejects.toThrow('Não é possível excluir o último administrador.');
      expect(repo.excluir).not.toHaveBeenCalled();
    });

    test('Deve excluir um passageiro', async () => {
      repo.buscarPorId.mockResolvedValue(passageiro);

      await service.excluir(7, 1);

      expect(repo.excluir).toHaveBeenCalledWith(7);
    });

    test('Deve excluir um administrador quando existirem outros', async () => {
      repo.buscarPorId.mockResolvedValue({ ...admin, id: 3 });
      repo.contarAdmins.mockResolvedValue(2);

      await service.excluir(3, 1);

      expect(repo.excluir).toHaveBeenCalledWith(3);
    });
  });
});