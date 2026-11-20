const usuariosService = require('../services/usuariosService');
const usuariosController = require('../controllers/usuariosController');

jest.mock('../services/usuariosService', () => ({
  cadastrar: jest.fn(),
  login: jest.fn(),
}));

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const CADASTRO = { nome: 'Maria Silva', email: 'maria@email.com', senha: 'senha123' };
const LOGIN = { email: 'maria@email.com', senha: 'senha123' };

// -----testes------
describe('UsuariosController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('cadastrar', () => {
    it('repassa nome, e-mail e senha do corpo ao serviço', async () => {
      usuariosService.cadastrar.mockResolvedValue({ id: 1 });

      await usuariosController.cadastrar({ body: CADASTRO }, criarRes());

      expect(usuariosService.cadastrar).toHaveBeenCalledWith(
        CADASTRO.nome,
        CADASTRO.email,
        CADASTRO.senha
      );
    });

    it('responde 201 com o usuário criado', async () => {
      const usuario = { id: 1, nome: CADASTRO.nome, email: CADASTRO.email, tipo: 'PASSAGEIRO' };
      usuariosService.cadastrar.mockResolvedValue(usuario);
      const res = criarRes();

      await usuariosController.cadastrar({ body: CADASTRO }, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(usuario);
    });

    it('responde 400 com a mensagem do erro quando o cadastro é recusado', async () => {
      usuariosService.cadastrar.mockRejectedValue(new Error('E-mail já cadastrado.'));
      const res = criarRes();

      await usuariosController.cadastrar({ body: CADASTRO }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'E-mail já cadastrado.',
      });
    });
  });

  describe('login', () => {
    it('repassa e-mail e senha do corpo ao serviço', async () => {
      usuariosService.login.mockResolvedValue({ token: 'abc' });

      await usuariosController.login({ body: LOGIN }, criarRes());

      expect(usuariosService.login).toHaveBeenCalledWith(LOGIN.email, LOGIN.senha);
    });

    it('responde 200 com o token e o usuário', async () => {
      const dados = { token: 'abc', usuario: { id: 1, nome: 'Maria Silva' } };
      usuariosService.login.mockResolvedValue(dados);
      const res = criarRes();

      await usuariosController.login({ body: LOGIN }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(dados);
    });

    it('responde 401 com a mensagem do erro quando as credenciais são recusadas', async () => {
      usuariosService.login.mockRejectedValue(new Error('Email ou senha incorretos.'));
      const res = criarRes();

      await usuariosController.login({ body: LOGIN }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'UNAUTHORIZED',
        detalhes: 'Email ou senha incorretos.',
      });
    });
  });
});
