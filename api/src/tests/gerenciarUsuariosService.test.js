jest.mock('bcrypt', () => ({ hash: jest.fn() }));
jest.mock('../repositories/usuariosRepository', () => ({
  buscarPorEmail: jest.fn(),
}));
jest.mock('../repositories/gerenciarUsuariosRepository', () => ({
  listar: jest.fn(),
  buscarPorId: jest.fn(),
  atualizar: jest.fn(),
  contarAdmins: jest.fn(),
  excluir: jest.fn(),
}));

const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuariosRepository');
const repo = require('../repositories/gerenciarUsuariosRepository');
const gerenciarUsuariosService = require('../services/gerenciarUsuariosService');

const ADMIN_ANA = { id: 1, nome: 'Ana', email: 'ana@ex.com', tipo: 'ADMIN' };
const PASSAGEIRO_BRUNO = { id: 2, nome: 'Bruno', email: 'bruno@ex.com', tipo: 'PASSAGEIRO' };

describe('GerenciarUsuariosService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    repo.buscarPorId.mockResolvedValue(PASSAGEIRO_BRUNO);
    repo.contarAdmins.mockResolvedValue(2);
    repo.atualizar.mockResolvedValue({ id: 2, atualizado: true });
    repo.excluir.mockResolvedValue(undefined);
    usuariosRepository.buscarPorEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hash-gerado');
  });

  describe('listar', () => {
    it('repassa o filtro de tipo ao repositório e retorna a lista', async () => {
      const lista = [ADMIN_ANA];
      repo.listar.mockResolvedValue(lista);

      const resultado = await gerenciarUsuariosService.listar('ADMIN');

      expect(repo.listar).toHaveBeenCalledWith('ADMIN');
      expect(resultado).toBe(lista);
    });

    it('lista sem filtro quando o tipo não é informado', async () => {
      repo.listar.mockResolvedValue([ADMIN_ANA, PASSAGEIRO_BRUNO]);

      await gerenciarUsuariosService.listar();

      expect(repo.listar).toHaveBeenCalledWith(undefined);
    });
  });

  describe('atualizar', () => {
    const dados = { nome: 'Bruno Silva', email: 'bruno.silva@ex.com' };

    describe('validações', () => {
      it('lança erro quando o usuário não existe', async () => {
        repo.buscarPorId.mockResolvedValue(null);

        await expect(gerenciarUsuariosService.atualizar(99, dados, 1)).rejects.toThrow(
          'Usuário não encontrado.'
        );
        expect(repo.atualizar).not.toHaveBeenCalled();
      });

      it.each([
        ['nome', { email: 'x@ex.com' }],
        ['email', { nome: 'Fulano' }],
      ])('exige %s', async (_campo, parcial) => {
        await expect(gerenciarUsuariosService.atualizar(2, parcial, 1)).rejects.toThrow(
          'Nome e email são obrigatórios.'
        );
        expect(repo.atualizar).not.toHaveBeenCalled();
      });

      it('rejeita tipo inválido antes de consultar o email', async () => {
        await expect(
          gerenciarUsuariosService.atualizar(2, { ...dados, tipo: 'SUPERUSER' }, 1)
        ).rejects.toThrow('Tipo inválido.');
        expect(usuariosRepository.buscarPorEmail).not.toHaveBeenCalled();
        expect(repo.atualizar).not.toHaveBeenCalled();
      });

      it('rejeita senha com menos de 6 caracteres', async () => {
        await expect(
          gerenciarUsuariosService.atualizar(2, { ...dados, senha: '12345' }, 1)
        ).rejects.toThrow('A senha deve ter pelo menos 6 caracteres.');
        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(repo.atualizar).not.toHaveBeenCalled();
      });

      it('aceita senha com exatamente 6 caracteres', async () => {
        await gerenciarUsuariosService.atualizar(2, { ...dados, senha: '123456' }, 1);

        expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
        expect(repo.atualizar).toHaveBeenCalledTimes(1);
      });

      it('rejeita email que já pertence a outro usuário', async () => {
        usuariosRepository.buscarPorEmail.mockResolvedValue({ id: 3, email: dados.email });

        await expect(gerenciarUsuariosService.atualizar(2, dados, 1)).rejects.toThrow(
          'Este email já está cadastrado.'
        );
        expect(repo.atualizar).not.toHaveBeenCalled();
      });

      it('permite manter o próprio email', async () => {
        usuariosRepository.buscarPorEmail.mockResolvedValue({ id: 2, email: dados.email });

        await gerenciarUsuariosService.atualizar(2, dados, 1);

        expect(repo.atualizar).toHaveBeenCalledTimes(1);
      });
    });

    describe('tipo do usuário', () => {
      it('mantém o tipo atual quando "tipo" não é informado', async () => {
        await gerenciarUsuariosService.atualizar(2, dados, 1);

        expect(repo.atualizar).toHaveBeenCalledWith(
          2, 'Bruno Silva', 'bruno.silva@ex.com', null, 'PASSAGEIRO'
        );
      });

      it('permite promover passageiro a administrador sem checar a contagem de admins', async () => {
        await gerenciarUsuariosService.atualizar(2, { ...dados, tipo: 'ADMIN' }, 1);

        expect(repo.contarAdmins).not.toHaveBeenCalled();
        expect(repo.atualizar).toHaveBeenCalledWith(
          2, 'Bruno Silva', 'bruno.silva@ex.com', null, 'ADMIN'
        );
      });
    });

    describe('rebaixamento de administradores', () => {
      const dadosRebaixar = { nome: 'Ana', email: 'ana@ex.com', tipo: 'PASSAGEIRO' };

      beforeEach(() => {
        repo.buscarPorId.mockResolvedValue(ADMIN_ANA);
      });

      it('impede o administrador de rebaixar a si mesmo', async () => {
        await expect(gerenciarUsuariosService.atualizar(1, dadosRebaixar, 1)).rejects.toThrow(
          'Você não pode rebaixar a si mesma.'
        );
        expect(repo.contarAdmins).not.toHaveBeenCalled();
        expect(repo.atualizar).not.toHaveBeenCalled();
      });

      it('impede rebaixar o último administrador', async () => {
        repo.contarAdmins.mockResolvedValue(1);

        await expect(gerenciarUsuariosService.atualizar(1, dadosRebaixar, 5)).rejects.toThrow(
          'Não é possível remover o último administrador.'
        );
        expect(repo.atualizar).not.toHaveBeenCalled();
      });

      it('permite rebaixar um administrador quando existem outros', async () => {
        repo.contarAdmins.mockResolvedValue(2);

        await gerenciarUsuariosService.atualizar(1, dadosRebaixar, 5);

        expect(repo.atualizar).toHaveBeenCalledWith(1, 'Ana', 'ana@ex.com', null, 'PASSAGEIRO');
      });

      it('não consulta a contagem de admins quando o usuário continua ADMIN', async () => {
        await gerenciarUsuariosService.atualizar(1, { nome: 'Ana Maria', email: 'ana@ex.com' }, 1);

        expect(repo.contarAdmins).not.toHaveBeenCalled();
        expect(repo.atualizar).toHaveBeenCalledWith(1, 'Ana Maria', 'ana@ex.com', null, 'ADMIN');
      });
    });

    describe('senha e retorno', () => {
      it('gera o hash da nova senha (bcrypt, 10 rounds) e o envia ao repositório', async () => {
        await gerenciarUsuariosService.atualizar(2, { ...dados, senha: 'novaSenha1' }, 1);

        expect(bcrypt.hash).toHaveBeenCalledWith('novaSenha1', 10);
        expect(repo.atualizar).toHaveBeenCalledWith(
          2, 'Bruno Silva', 'bruno.silva@ex.com', 'hash-gerado', 'PASSAGEIRO'
        );
      });

      it('não altera a senha quando ela não é enviada', async () => {
        await gerenciarUsuariosService.atualizar(2, dados, 1);

        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(repo.atualizar.mock.calls[0][3]).toBeNull();
      });

      it('trata senha vazia como "não alterar a senha"', async () => {
        await gerenciarUsuariosService.atualizar(2, { ...dados, senha: '' }, 1);

        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(repo.atualizar.mock.calls[0][3]).toBeNull();
      });

      it('retorna o usuário atualizado pelo repositório', async () => {
        const atualizado = { id: 2, nome: 'Bruno Silva' };
        repo.atualizar.mockResolvedValue(atualizado);

        await expect(gerenciarUsuariosService.atualizar(2, dados, 1)).resolves.toBe(atualizado);
      });
    });
  });

  describe('excluir', () => {
    it('lança erro quando o usuário não existe', async () => {
      repo.buscarPorId.mockResolvedValue(null);

      await expect(gerenciarUsuariosService.excluir(99, 1)).rejects.toThrow(
        'Usuário não encontrado.'
      );
      expect(repo.excluir).not.toHaveBeenCalled();
    });

    it('impede o usuário de excluir a própria conta', async () => {
      repo.buscarPorId.mockResolvedValue(ADMIN_ANA);

      await expect(gerenciarUsuariosService.excluir(1, 1)).rejects.toThrow(
        'Você não pode excluir a própria conta.'
      );
      expect(repo.excluir).not.toHaveBeenCalled();
    });

    it('impede excluir o último administrador', async () => {
      repo.buscarPorId.mockResolvedValue(ADMIN_ANA);
      repo.contarAdmins.mockResolvedValue(1);

      await expect(gerenciarUsuariosService.excluir(1, 5)).rejects.toThrow(
        'Não é possível excluir o último administrador.'
      );
      expect(repo.excluir).not.toHaveBeenCalled();
    });

    it('exclui um administrador quando existem outros', async () => {
      repo.buscarPorId.mockResolvedValue(ADMIN_ANA);
      repo.contarAdmins.mockResolvedValue(2);

      await gerenciarUsuariosService.excluir(1, 5);

      expect(repo.excluir).toHaveBeenCalledWith(1);
    });

    it('exclui um passageiro sem consultar a contagem de admins', async () => {
      await gerenciarUsuariosService.excluir(2, 1);

      expect(repo.contarAdmins).not.toHaveBeenCalled();
      expect(repo.excluir).toHaveBeenCalledWith(2);
    });

    it('não retorna valor em caso de sucesso', async () => {
      await expect(gerenciarUsuariosService.excluir(2, 1)).resolves.toBeUndefined();
    });
  });
});
