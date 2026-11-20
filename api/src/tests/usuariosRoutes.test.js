jest.mock('../controllers/usuariosController', () => ({
  cadastrar: jest.fn(),
  login: jest.fn(),
}));

const usuariosController = require('../controllers/usuariosController');
const router = require('../routes/usuariosRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('usuariosRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual(['POST /cadastro', 'POST /login']);
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
});
