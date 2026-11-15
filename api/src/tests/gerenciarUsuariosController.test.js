jest.mock('../services/gerenciarUsuariosService');

const service = require('../services/gerenciarUsuariosService');
const controller = require('../controllers/gerenciarUsuariosController');

describe('GerenciarUsuariosController', () => {
  let req, res;

  beforeEach(() => {
    jest.resetAllMocks();
    req = { query: {}, params: {}, body: {}, usuario: { id: 1, tipo: 'ADMIN' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Deve listar usuários com HTTP 200', async () => {
    req.query = { tipo: 'ADMIN' };
    const lista = [{ id: 1, nome: 'Admin', tipo: 'ADMIN' }];
    service.listar.mockResolvedValue(lista);

    await controller.listar(req, res);

    expect(service.listar).toHaveBeenCalledWith('ADMIN');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(lista);
  });

  test('Deve atualizar um usuário com HTTP 200', async () => {
    req.params = { id: '7' };
    req.body = { nome: 'João', email: 'joao@teste.com' };
    const atualizado = { id: 7, nome: 'João', email: 'joao@teste.com', tipo: 'PASSAGEIRO' };
    service.atualizar.mockResolvedValue(atualizado);

    await controller.atualizar(req, res);

    expect(service.atualizar).toHaveBeenCalledWith(7, req.body, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(atualizado);
  });

  test('Deve retornar HTTP 404 se o usuário não for encontrado', async () => {
    req.params = { id: '99' };
    service.atualizar.mockRejectedValue(new Error('Usuário não encontrado.'));

    await controller.atualizar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'NOT_FOUND', detalhes: 'Usuário não encontrado.' });
  });

  test('Deve retornar HTTP 400 quando uma regra for violada na atualização', async () => {
    req.params = { id: '7' };
    service.atualizar.mockRejectedValue(new Error('Este email já está cadastrado.'));

    await controller.atualizar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'BAD_REQUEST', detalhes: 'Este email já está cadastrado.' });
  });

  test('Deve excluir um usuário com HTTP 200', async () => {
    req.params = { id: '7' };
    service.excluir.mockResolvedValue();

    await controller.excluir(req, res);

    expect(service.excluir).toHaveBeenCalledWith(7, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Usuário excluído.' });
  });

  test('Deve retornar HTTP 400 ao tentar excluir a própria conta', async () => {
    req.params = { id: '1' };
    service.excluir.mockRejectedValue(new Error('Você não pode excluir a própria conta.'));

    await controller.excluir(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'BAD_REQUEST', detalhes: 'Você não pode excluir a própria conta.' });
  });
});