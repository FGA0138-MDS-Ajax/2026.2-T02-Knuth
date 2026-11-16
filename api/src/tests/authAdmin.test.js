const jwt = require('jsonwebtoken');
const authAdmin = require('../middlewares/authAdmin');

const SEGREDO = process.env.JWT_SECRET || 'chave_secreta_padrao';

describe('authAdmin (middleware)', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('Deve retornar HTTP 401 se nenhum token for enviado', () => {
    authAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('Deve retornar HTTP 401 se o token for inválido', () => {
    req.headers.authorization = 'Bearer token_falso';

    authAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('Deve retornar HTTP 403 se o usuário não for ADMIN', () => {
    const token = jwt.sign({ id: 1, tipo: 'PASSAGEIRO' }, SEGREDO);
    req.headers.authorization = `Bearer ${token}`;

    authAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('Deve liberar o acesso (next) se o usuário for ADMIN', () => {
    const token = jwt.sign({ id: 2, tipo: 'ADMIN' }, SEGREDO);
    req.headers.authorization = `Bearer ${token}`;

    authAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.usuario.tipo).toBe('ADMIN');
  });
});