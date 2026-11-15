const express = require('express');
const router = express.Router();
const authAdmin = require('../middlewares/authAdmin');
const adminController = require('../controllers/adminController');

router.get('/perfil', authAdmin, (req, res) => {
  return res.status(200).json({
    mensagem: 'Acesso de administrador liberado.',
    usuario: req.usuario
  });
});

router.post('/usuarios', authAdmin, adminController.criarAdministrador);

module.exports = router;