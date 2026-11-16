const jwt = require('jsonwebtoken');

const SEGREDO = process.env.JWT_SECRET || 'chave_secreta_padrao';

function authAdmin(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'UNAUTHORIZED', detalhes: 'Token não informado.' });
  }

  const token = cabecalho.split(' ')[1];

  let dados;
  try {
    dados = jwt.verify(token, SEGREDO);
  } catch (error) {
    return res.status(401).json({ erro: 'UNAUTHORIZED', detalhes: 'Token inválido ou expirado.' });
  }

  if (dados.tipo !== 'ADMIN') {
    return res.status(403).json({ erro: 'FORBIDDEN', detalhes: 'Acesso restrito ao administrador.' });
  }

  req.usuario = dados;
  next();
}

module.exports = authAdmin;