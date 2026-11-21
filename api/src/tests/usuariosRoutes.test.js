jest.mock('../controllers/usuariosController', () => ({
  cadastrar: jest.fn(),
  login: jest.fn(),
  solicitarRecuperacaoSenha: jest.fn(),
  redefinirSenha: jest.fn(),
  excluirConta: jest.fn(),
}));

const usuariosController = require('../controllers/usuariosController');
const authUsuario = require('../middlewares/authUsuario');
const router = require('../routes/usuariosRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('usuariosRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual([
      'POST /cadastro',
      'POST /login',
      'POST /recuperar-senha',
      'POST /redefinir-senha',
      'DELETE /me',
    ]);
  });

  it('POST /cadastro usa usuariosController.cadastrar', () => {
    const rota = buscarRota(router, 'POST', '/cadastro');

    expect(rota.handlers).toEqual([usuariosController.cadastrar]);
  });

  it('POST /login usa usuariosController.login', () => {
    const rota = buscarRota(router, 'POST', '/login');

    expect(rota.handlers).toEqual([usuariosController.login]);
  });

  it('não expõe cadastro nem login via GET', () => {
    expect(buscarRota(router, 'GET', '/cadastro')).toBeUndefined();
    expect(buscarRota(router, 'GET', '/login')).toBeUndefined();
  });

  it('POST /recuperar-senha é público e usa usuariosController.solicitarRecuperacaoSenha', () => {
    const rota = buscarRota(router, 'POST', '/recuperar-senha');

    expect(rota.handlers).toEqual([usuariosController.solicitarRecuperacaoSenha]);
  });

  it('POST /redefinir-senha é público e usa usuariosController.redefinirSenha', () => {
    const rota = buscarRota(router, 'POST', '/redefinir-senha');

    expect(rota.handlers).toEqual([usuariosController.redefinirSenha]);
  });

  it('DELETE /me exige autenticação (authUsuario) antes de usuariosController.excluirConta', () => {
    const rota = buscarRota(router, 'DELETE', '/me');

    expect(rota.handlers).toEqual([authUsuario, usuariosController.excluirConta]);
  });
});
