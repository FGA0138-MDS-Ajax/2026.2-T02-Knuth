jest.mock('../middlewares/authAdmin', () => jest.fn());
jest.mock('../controllers/adminController', () => ({
  criarAdministrador: jest.fn(),
}));
jest.mock('../controllers/gerenciarUsuariosController', () => ({
  listar: jest.fn(),
  atualizar: jest.fn(),
  excluir: jest.fn(),
}));
jest.mock('../controllers/analisarReportesController', () => ({
  listar: jest.fn(),
  obterPorId: jest.fn(),
  analisar: jest.fn(),
}));

const authAdmin = require('../middlewares/authAdmin');
const adminController = require('../controllers/adminController');
const gerenciarUsuariosController = require('../controllers/gerenciarUsuariosController');
const analisarReportesController = require('../controllers/analisarReportesController');
const router = require('../routes/adminRoutes');
const { buscarRota, assinaturas, criarRes } = require('../tests/rotas');

describe('adminRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual([
      'GET /perfil',
      'POST /usuarios',
      'GET /usuarios',
      'PUT /usuarios/:id',
      'DELETE /usuarios/:id',
      'GET /reportes',
      'GET /reportes/:id',
      'PATCH /reportes/:id',
    ]);
  });

  it.each([
    ['GET', '/perfil'],
    ['POST', '/usuarios'],
    ['GET', '/usuarios'],
    ['PUT', '/usuarios/:id'],
    ['DELETE', '/usuarios/:id'],
    ['GET', '/reportes'],
    ['GET', '/reportes/:id'],
    ['PATCH', '/reportes/:id'],
  ])('%s %s é protegida pelo middleware authAdmin (executado primeiro)', (metodo, caminho) => {
    const rota = buscarRota(router, metodo, caminho);

    expect(rota.handlers).toHaveLength(2);
    expect(rota.handlers[0]).toBe(authAdmin);
  });

  it('POST /usuarios usa adminController.criarAdministrador', () => {
    const rota = buscarRota(router, 'POST', '/usuarios');

    expect(rota.handlers[1]).toBe(adminController.criarAdministrador);
  });

  it('GET /usuarios usa gerenciarUsuariosController.listar', () => {
    const rota = buscarRota(router, 'GET', '/usuarios');

    expect(rota.handlers[1]).toBe(gerenciarUsuariosController.listar);
  });

  it('PUT /usuarios/:id usa gerenciarUsuariosController.atualizar', () => {
    const rota = buscarRota(router, 'PUT', '/usuarios/:id');

    expect(rota.handlers[1]).toBe(gerenciarUsuariosController.atualizar);
  });

  it('DELETE /usuarios/:id usa gerenciarUsuariosController.excluir', () => {
    const rota = buscarRota(router, 'DELETE', '/usuarios/:id');

    expect(rota.handlers[1]).toBe(gerenciarUsuariosController.excluir);
  });

  it('GET /reportes usa analisarReportesController.listar', () => {
    const rota = buscarRota(router, 'GET', '/reportes');

    expect(rota.handlers[1]).toBe(analisarReportesController.listar);
  });

  it('GET /reportes/:id usa analisarReportesController.obterPorId', () => {
    const rota = buscarRota(router, 'GET', '/reportes/:id');

    expect(rota.handlers[1]).toBe(analisarReportesController.obterPorId);
  });

  it('PATCH /reportes/:id usa analisarReportesController.analisar', () => {
    const rota = buscarRota(router, 'PATCH', '/reportes/:id');

    expect(rota.handlers[1]).toBe(analisarReportesController.analisar);
  });

  describe('GET /perfil', () => {
    it('responde 200 com mensagem de acesso liberado e o usuário da requisição', () => {
      const rota = buscarRota(router, 'GET', '/perfil');
      const req = { usuario: { id: 1, tipo: 'ADMIN' } };
      const res = criarRes();

      rota.handlers[1](req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Acesso de administrador liberado.',
        usuario: { id: 1, tipo: 'ADMIN' },
      });
    });
  });
});
