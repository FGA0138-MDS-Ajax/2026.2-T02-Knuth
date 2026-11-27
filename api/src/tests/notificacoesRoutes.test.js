jest.mock('../controllers/notificacoesController', () => ({
  listar: jest.fn(),
  contarNaoLidas: jest.fn(),
  marcarComoLida: jest.fn(),
}));

const notificacoesController = require('../controllers/notificacoesController');
const authUsuario = require('../middlewares/authUsuario');
const router = require('../routes/notificacoesRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('notificacoesRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual(['GET /', 'GET /nao-lidas', 'PUT /:id/lida']);
  });

  it('GET / exige autenticação (authUsuario) antes de notificacoesController.listar', () => {
    const rota = buscarRota(router, 'GET', '/');

    expect(rota.handlers).toEqual([authUsuario, notificacoesController.listar]);
  });

  it('GET /nao-lidas exige autenticação (authUsuario) antes de notificacoesController.contarNaoLidas', () => {
    const rota = buscarRota(router, 'GET', '/nao-lidas');

    expect(rota.handlers).toEqual([authUsuario, notificacoesController.contarNaoLidas]);
  });

  it('PUT /:id/lida exige autenticação (authUsuario) antes de notificacoesController.marcarComoLida', () => {
    const rota = buscarRota(router, 'PUT', '/:id/lida');

    expect(rota.handlers).toEqual([authUsuario, notificacoesController.marcarComoLida]);
  });

  it('não expõe remoção de notificação via DELETE', () => {
    expect(buscarRota(router, 'DELETE', '/:id')).toBeUndefined();
  });
});
