const SEGREDO = 'segredo-de-teste';
const SEGREDO_ORIGINAL = process.env.JWT_SECRET;
process.env.JWT_SECRET = SEGREDO;

const jwt = require('jsonwebtoken');
const authUsuario = require('../middlewares/authUsuario');

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const criarReq = (authorization) => ({
  headers: authorization === undefined ? {} : { authorization },
});

const assinar = (payload, segredo = SEGREDO) => jwt.sign(payload, segredo);

const TOKEN_NAO_INFORMADO = { erro: 'UNAUTHORIZED', detalhes: 'Token não informado.' };
const TOKEN_INVALIDO = { erro: 'UNAUTHORIZED', detalhes: 'Token inválido ou expirado.' };

// -----testes------
describe('authUsuario', () => {
  let next;

  beforeEach(() => {
    next = jest.fn();
  });

  afterAll(() => {
    if (SEGREDO_ORIGINAL === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = SEGREDO_ORIGINAL;
    }
  });

  it.each([
    ['não há cabeçalho Authorization', undefined],
    ['o cabeçalho não usa o esquema Bearer', 'Basic abc'],
  ])('responde 401 quando %s', (_caso, cabecalho) => {
    const res = criarRes();

    authUsuario(criarReq(cabecalho), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(TOKEN_NAO_INFORMADO);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 quando o token é malformado', () => {
    const res = criarRes();

    authUsuario(criarReq('Bearer nao-e-jwt'), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(TOKEN_INVALIDO);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 quando o token foi assinado com outro segredo', () => {
    const res = criarRes();

    authUsuario(criarReq(`Bearer ${assinar({ id: 1 }, 'outro')}`), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 quando o token expirou', () => {
    const token = assinar({ id: 1, exp: Math.floor(Date.now() / 1000) - 60 });
    const res = criarRes();

    authUsuario(criarReq(`Bearer ${token}`), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(TOKEN_INVALIDO);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 quando o token não identifica o usuário', () => {
    const res = criarRes();

    authUsuario(criarReq(`Bearer ${assinar({ tipo: 'PASSAGEIRO' })}`), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(TOKEN_INVALIDO);
    expect(next).not.toHaveBeenCalled();
  });

  it.each(['PASSAGEIRO', 'ADMIN'])('libera usuário %s e guarda os dados em req.usuario', (tipo) => {
    const req = criarReq(`Bearer ${assinar({ id: 5, tipo })}`);
    const res = criarRes();

    authUsuario(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.usuario).toMatchObject({ id: 5, tipo });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('usa "chave_secreta_padrao" quando JWT_SECRET não está definido', () => {
    delete process.env.JWT_SECRET;
    let middlewareSemEnv;
    jest.isolateModules(() => {
      middlewareSemEnv = require('../middlewares/authUsuario');
    });
    process.env.JWT_SECRET = SEGREDO;
    const req = criarReq(`Bearer ${assinar({ id: 1 }, 'chave_secreta_padrao')}`);

    middlewareSemEnv(req, criarRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
