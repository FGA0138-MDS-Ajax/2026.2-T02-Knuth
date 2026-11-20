const usuariosService = require('../services/usuariosService');
const usuariosController = require('../controllers/usuariosController');

jest.mock('../services/usuariosService', () => ({
  cadastrar: jest.fn(),
  login: jest.fn(),
  solicitarRecuperacaoSenha: jest.fn(),
  redefinirSenha: jest.fn(),
  excluirConta: jest.fn(),
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

// ---------- RF16: recuperação de senha e exclusão de conta ----------
describe('UsuariosController - RF16', () => {
  let erroSpy;

  const erroComStatus = (mensagem, status) => Object.assign(new Error(mensagem), { status });

  beforeEach(() => {
    jest.resetAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('solicitarRecuperacaoSenha', () => {
    it('repassa o e-mail e responde 200 com a mensagem do serviço', async () => {
      const dados = { mensagem: 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.' };
      usuariosService.solicitarRecuperacaoSenha.mockResolvedValue(dados);
      const res = criarRes();

      await usuariosController.solicitarRecuperacaoSenha({ body: { email: 'maria@email.com' } }, res);

      expect(usuariosService.solicitarRecuperacaoSenha).toHaveBeenCalledWith('maria@email.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(dados);
    });

    it('responde 400 quando o serviço recusa a solicitação', async () => {
      usuariosService.solicitarRecuperacaoSenha.mockRejectedValue(
        erroComStatus('O email é obrigatório.', 400)
      );
      const res = criarRes();

      await usuariosController.solicitarRecuperacaoSenha({ body: {} }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ erro: 'BAD_REQUEST', detalhes: 'O email é obrigatório.' });
    });

    it('aceita requisição sem corpo', async () => {
      usuariosService.solicitarRecuperacaoSenha.mockRejectedValue(
        erroComStatus('O email é obrigatório.', 400)
      );

      await usuariosController.solicitarRecuperacaoSenha({}, criarRes());

      expect(usuariosService.solicitarRecuperacaoSenha).toHaveBeenCalledWith(undefined);
    });

    it('responde 500 sem expor detalhes quando ocorre erro inesperado', async () => {
      usuariosService.solicitarRecuperacaoSenha.mockRejectedValue(new Error('falha no banco'));
      const res = criarRes();

      await usuariosController.solicitarRecuperacaoSenha({ body: { email: 'a@b.com' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao solicitar a recuperação de senha.',
      });
    });
  });

  describe('redefinirSenha', () => {
    const CORPO = { email: 'maria@email.com', codigo: '123456', novaSenha: 'novaSenha' };

    it('repassa e-mail, código e nova senha e responde 200', async () => {
      usuariosService.redefinirSenha.mockResolvedValue({ mensagem: 'Senha redefinida com sucesso.' });
      const res = criarRes();

      await usuariosController.redefinirSenha({ body: CORPO }, res);

      expect(usuariosService.redefinirSenha).toHaveBeenCalledWith('maria@email.com', '123456', 'novaSenha');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ mensagem: 'Senha redefinida com sucesso.' });
    });

    it('responde 400 com a mensagem quando o código é inválido', async () => {
      usuariosService.redefinirSenha.mockRejectedValue(
        erroComStatus('Código inválido ou expirado.', 400)
      );
      const res = criarRes();

      await usuariosController.redefinirSenha({ body: CORPO }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'Código inválido ou expirado.',
      });
    });

    it('responde 500 quando ocorre erro inesperado', async () => {
      usuariosService.redefinirSenha.mockRejectedValue(new Error('falha no banco'));
      const res = criarRes();

      await usuariosController.redefinirSenha({ body: CORPO }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao redefinir a senha.',
      });
    });
  });

  describe('excluirConta', () => {
    const req = { usuario: { id: 7, tipo: 'PASSAGEIRO' }, body: { senha: 'senha123' } };

    it('usa o id do token e a senha do corpo, respondendo 200', async () => {
      usuariosService.excluirConta.mockResolvedValue({ mensagem: 'Conta excluída com sucesso.' });
      const res = criarRes();

      await usuariosController.excluirConta(req, res);

      expect(usuariosService.excluirConta).toHaveBeenCalledWith(7, 'senha123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ mensagem: 'Conta excluída com sucesso.' });
    });

    it.each([
      [400, 'BAD_REQUEST', 'Informe sua senha para confirmar a exclusão.'],
      [401, 'UNAUTHORIZED', 'Senha incorreta.'],
      [403, 'FORBIDDEN', 'A exclusão da própria conta está disponível apenas para passageiros.'],
      [404, 'NOT_FOUND', 'Usuário não encontrado.'],
    ])('responde %i (%s) conforme o erro do serviço', async (status, codigo, mensagem) => {
      usuariosService.excluirConta.mockRejectedValue(erroComStatus(mensagem, status));
      const res = criarRes();

      await usuariosController.excluirConta(req, res);

      expect(res.status).toHaveBeenCalledWith(status);
      expect(res.json).toHaveBeenCalledWith({ erro: codigo, detalhes: mensagem });
    });

    it('responde 500 quando ocorre erro inesperado', async () => {
      usuariosService.excluirConta.mockRejectedValue(new Error('falha no banco'));
      const res = criarRes();

      await usuariosController.excluirConta({ usuario: { id: 7 } }, res);

      expect(usuariosService.excluirConta).toHaveBeenCalledWith(7, undefined);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao excluir a conta.',
      });
    });
  });
});
