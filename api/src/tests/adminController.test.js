jest.mock('../services/adminService');

const adminService = require('../services/adminService');
const adminController = require('../controllers/adminController');

describe('AdminController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Deve criar um administrador com sucesso (HTTP 201)', async () => {
    req.body = { nome: 'Maria', email: 'maria@teste.com', senha: '123456' };
    const mockAdmin = { id: 5, nome: 'Maria', email: 'maria@teste.com', tipo: 'ADMIN' };
    adminService.criarAdministrador.mockResolvedValue(mockAdmin);

    await adminController.criarAdministrador(req, res);

    expect(adminService.criarAdministrador).toHaveBeenCalledWith('Maria', 'maria@teste.com', '123456');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockAdmin);
  });

  test('Deve retornar HTTP 400 quando o service lançar erro', async () => {
    req.body = { nome: 'Maria', email: 'maria@teste.com', senha: '123' };
    adminService.criarAdministrador.mockRejectedValue(new Error('A senha deve ter pelo menos 6 caracteres.'));

    await adminController.criarAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'BAD_REQUEST',
      detalhes: 'A senha deve ter pelo menos 6 caracteres.'
    });
  });
});