const jwt = require('jsonwebtoken');

const SEGREDO = process.env.JWT_SECRET || 'chave_secreta_padrao';

// Exige um usuário autenticado (qualquer perfil) e guarda os dados do token em req.usuario.
function authUsuario(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'UNAUTHORIZED', detalhes: 'Token não informado.' });
  }

  const token = cabecalho.split(' ')[1];

  try {
    req.usuario = jwt.verify(token, SEGREDO);
  } catch (error) {
    return res.status(401).json({ erro: 'UNAUTHORIZED', detalhes: 'Token inválido ou expirado.' });
  }

  if (!req.usuario || req.usuario.id === undefined) {
    return res.status(401).json({ erro: 'UNAUTHORIZED', detalhes: 'Token inválido ou expirado.' });
  }

  next();
}

module.exports = authUsuario;
