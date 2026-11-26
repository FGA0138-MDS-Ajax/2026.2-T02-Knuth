jest.mock('../middlewares/authAdmin', () => jest.fn());
jest.mock('../controllers/manterLinhasParadasController', () => ({
  criarLinha: jest.fn(),
  editarLinha: jest.fn(),
  excluirLinha: jest.fn(),
  listarPartidas: jest.fn(),
  incluirPartida: jest.fn(),
  alterarPartida: jest.fn(),
  excluirPartida: jest.fn(),
  incluirParadaNoItinerario: jest.fn(),
  removerParadaDoItinerario: jest.fn(),
  obterParada: jest.fn(),
  criarParada: jest.fn(),
  editarParada: jest.fn(),
  excluirParada: jest.fn(),
}));

const authAdmin = require('../middlewares/authAdmin');
const manterLinhasParadasController = require('../controllers/manterLinhasParadasController');
const router = require('../routes/adminLinhasParadasRoutes');
const { buscarRota, assinaturas } = require('../tests/rotas');

const ROTAS = [
  ['POST', '/linhas', 'criarLinha'],
  ['PUT', '/linhas/:id', 'editarLinha'],
  ['DELETE', '/linhas/:id', 'excluirLinha'],
  ['GET', '/linhas/:id/partidas', 'listarPartidas'],
  ['POST', '/linhas/:id/partidas', 'incluirPartida'],
  ['PUT', '/linhas/:id/partidas/:viagemId', 'alterarPartida'],
  ['DELETE', '/linhas/:id/partidas/:viagemId', 'excluirPartida'],
  ['POST', '/linhas/:id/itinerario', 'incluirParadaNoItinerario'],
  ['DELETE', '/linhas/:id/itinerario/:sentido/:sequencia', 'removerParadaDoItinerario'],
  ['GET', '/paradas/:id', 'obterParada'],
  ['POST', '/paradas', 'criarParada'],
  ['PUT', '/paradas/:id', 'editarParada'],
  ['DELETE', '/paradas/:id', 'excluirParada'],
];

describe('adminLinhasParadasRoutes', () => {
  it('registra exatamente as rotas esperadas', () => {
    expect(assinaturas(router)).toEqual(ROTAS.map(([metodo, caminho]) => `${metodo} ${caminho}`));
  });

  it('não registra GET /paradas, que continua sendo a busca do cadastro de alertas', () => {
    expect(buscarRota(router, 'GET', '/paradas')).toBeUndefined();
  });

  it.each(ROTAS)('%s %s é protegida pelo middleware authAdmin (executado primeiro)', (metodo, caminho) => {
    const rota = buscarRota(router, metodo, caminho);

    expect(rota.handlers).toHaveLength(2);
    expect(rota.handlers[0]).toBe(authAdmin);
  });

  it.each(ROTAS)('%s %s usa manterLinhasParadasController.%s', (metodo, caminho, nomeDoMetodo) => {
    const rota = buscarRota(router, metodo, caminho);

    expect(rota.handlers[1]).toBe(manterLinhasParadasController[nomeDoMetodo]);
  });
});
