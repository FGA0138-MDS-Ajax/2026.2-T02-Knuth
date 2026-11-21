jest.mock('../controllers/favoritosController', () => ({
  listar: jest.fn(),
  adicionar: jest.fn(),
  remover: jest.fn(),
}));

const favoritosController = require('../controllers/favoritosController');
const authUsuario = require('../middlewares/authUsuario');
const router = require('../routes/favoritosRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('favoritosRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual(['GET /', 'POST /', 'DELETE /:id']);
  });

  it('GET / exige autenticação (authUsuario) antes de favoritosController.listar', () => {
    const rota = buscarRota(router, 'GET', '/');

    expect(rota.handlers).toEqual([authUsuario, favoritosController.listar]);
  });

  it('POST / exige autenticação (authUsuario) antes de favoritosController.adicionar', () => {
    const rota = buscarRota(router, 'POST', '/');

    expect(rota.handlers).toEqual([authUsuario, favoritosController.adicionar]);
  });

  it('DELETE /:id exige autenticação (authUsuario) antes de favoritosController.remover', () => {
    const rota = buscarRota(router, 'DELETE', '/:id');

    expect(rota.handlers).toEqual([authUsuario, favoritosController.remover]);
  });

  it('não expõe alteração de favorito via PUT', () => {
    expect(buscarRota(router, 'PUT', '/:id')).toBeUndefined();
  });
});