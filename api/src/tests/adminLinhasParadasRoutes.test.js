jest.mock('../middlewares/authAdmin', () => jest.fn());
jest.mock('../controllers/manterLinhasParadasController', () => ({
  criarLinha: jest.fn(),
  editarLinha: jest.fn(),
  excluirLinha: jest.fn(),
}));

const authAdmin = require('../middlewares/authAdmin');
const manterLinhasParadasController = require('../controllers/manterLinhasParadasController');
const router = require('../routes/adminLinhasParadasRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

describe('adminLinhasParadasRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual([
      'POST /linhas',
      'PUT /linhas/:id',
      'DELETE /linhas/:id',
    ]);
  });

  it.each([
    ['POST', '/linhas'],
    ['PUT', '/linhas/:id'],
    ['DELETE', '/linhas/:id'],
  ])('%s %s é protegida pelo middleware authAdmin (executado primeiro)', (metodo, caminho) => {
    const rota = buscarRota(router, metodo, caminho);

    expect(rota.handlers).toHaveLength(2);
    expect(rota.handlers[0]).toBe(authAdmin);
  });

  it.each([
    ['POST', '/linhas', 'criarLinha'],
    ['PUT', '/linhas/:id', 'editarLinha'],
    ['DELETE', '/linhas/:id', 'excluirLinha'],
  ])('%s %s usa manterLinhasParadasController.%s', (metodo, caminho, nomeDoMetodo) => {
    const rota = buscarRota(router, metodo, caminho);

    expect(rota.handlers[1]).toBe(manterLinhasParadasController[nomeDoMetodo]);
  });
});
