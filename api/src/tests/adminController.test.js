const adminService = require('../services/adminService');
const adminController = require('../controllers/adminController');

jest.mock('../services/adminService', () => ({
  criarAdministrador: jest.fn(),
}));

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const CORPO = { nome: 'Carlos Souza', email: 'carlos@email.com', senha: 'senha123' };

// -----testes------
describe('AdminController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('criarAdministrador', () => {
    it('repassa nome, e-mail e senha do corpo ao serviço', async () => {
      adminService.criarAdministrador.mockResolvedValue({ id: 5 });

      await adminController.criarAdministrador({ body: CORPO }, criarRes());

      expect(adminService.criarAdministrador).toHaveBeenCalledWith(
        CORPO.nome,
        CORPO.email,
        CORPO.senha
      );
    });

    it('responde 201 com o administrador criado', async () => {
      const admin = { id: 5, nome: CORPO.nome, email: CORPO.email, tipo: 'ADMIN' };
      adminService.criarAdministrador.mockResolvedValue(admin);
      const res = criarRes();

      await adminController.criarAdministrador({ body: CORPO }, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(admin);
    });

    it('responde 400 com a mensagem do erro quando o cadastro é recusado', async () => {
      adminService.criarAdministrador.mockRejectedValue(new Error('E-mail já cadastrado.'));
      const res = criarRes();

      await adminController.criarAdministrador({ body: CORPO }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'E-mail já cadastrado.',
      });
    });
  });
});
