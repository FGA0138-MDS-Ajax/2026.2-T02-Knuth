const express = require('express');
const router = express.Router();
const authAdmin = require('../middlewares/authAdmin');

router.get('/perfil', authAdmin, (req, res) => {
  return res.status(200).json({
    mensagem: 'Acesso de administrador liberado.',
    usuario: req.usuario
  });
});

module.exports = router;