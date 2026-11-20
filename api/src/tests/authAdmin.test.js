const SEGREDO = 'segredo-de-teste';
const SEGREDO_ORIGINAL = process.env.JWT_SECRET;
process.env.JWT_SECRET = SEGREDO;

const jwt = require('jsonwebtoken');
const authAdmin = require('../src/middlewares/authAdmin');

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

// -----testes------
describe('authAdmin', () => {
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

  describe('token ausente', () => {
    it('responde 401 quando não há cabeçalho Authorization', () => {
      const res = criarRes();

      authAdmin(criarReq(), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'UNAUTHORIZED',
        detalhes: 'Token não informado.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it.each([['Basic abc123'], ['abc123'], ['bearer abc123']])(
      'responde 401 quando o cabeçalho não começa com "Bearer " (%s)',
      (cabecalho) => {
        const res = criarRes();

        authAdmin(criarReq(cabecalho), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          erro: 'UNAUTHORIZED',
          detalhes: 'Token não informado.',
        });
        expect(next).not.toHaveBeenCalled();
      }
    );
  });

  describe('token inválido', () => {
    it('responde 401 quando o "Bearer" vem sem token', () => {
      const res = criarRes();

      authAdmin(criarReq('Bearer '), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'UNAUTHORIZED',
        detalhes: 'Token inválido ou expirado.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('responde 401 quando o token está malformado', () => {
      const res = criarRes();

      authAdmin(criarReq('Bearer isso-nao-e-um-jwt'), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'UNAUTHORIZED',
        detalhes: 'Token inválido ou expirado.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('responde 401 quando o token foi assinado com outro segredo', () => {
      const token = assinar({ id: 1, tipo: 'ADMIN' }, 'outro-segredo');
      const res = criarRes();

      authAdmin(criarReq(`Bearer ${token}`), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'UNAUTHORIZED',
        detalhes: 'Token inválido ou expirado.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('responde 401 quando o token expirou', () => {
      const token = assinar({
        id: 1,
        tipo: 'ADMIN',
        exp: Math.floor(Date.now() / 1000) - 60,
      });
      const res = criarRes();

      authAdmin(criarReq(`Bearer ${token}`), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'UNAUTHORIZED',
        detalhes: 'Token inválido ou expirado.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('permissão', () => {
    it('responde 403 quando o usuário do token não é administrador', () => {
      const token = assinar({ id: 2, tipo: 'PASSAGEIRO' });
      const res = criarRes();

      authAdmin(criarReq(`Bearer ${token}`), res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'FORBIDDEN',
        detalhes: 'Acesso restrito ao administrador.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('responde 403 quando o token não informa o tipo do usuário', () => {
      const token = assinar({ id: 3 });
      const res = criarRes();

      authAdmin(criarReq(`Bearer ${token}`), res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('libera o acesso e guarda os dados do token em req.usuario quando é administrador', () => {
      const token = assinar({ id: 1, tipo: 'ADMIN', email: 'admin@email.com' });
      const req = criarReq(`Bearer ${token}`);
      const res = criarRes();

      authAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.usuario).toMatchObject({ id: 1, tipo: 'ADMIN', email: 'admin@email.com' });
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('segredo padrão', () => {
    it('usa "chave_secreta_padrao" quando JWT_SECRET não está definido', () => {
      delete process.env.JWT_SECRET;
      let middlewareSemEnv;
      jest.isolateModules(() => {
        middlewareSemEnv = require('../src/middlewares/authAdmin');
      });
      process.env.JWT_SECRET = SEGREDO;
      const token = assinar({ id: 1, tipo: 'ADMIN' }, 'chave_secreta_padrao');
      const req = criarReq(`Bearer ${token}`);

      middlewareSemEnv(req, criarRes(), next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.usuario).toMatchObject({ id: 1, tipo: 'ADMIN' });
    });
  });
});
