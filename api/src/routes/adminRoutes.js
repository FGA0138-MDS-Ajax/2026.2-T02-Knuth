const express = require('express');
const router = express.Router();
const authAdmin = require('../middlewares/authAdmin');
const adminController = require('../controllers/adminController');
const gerenciarUsuariosController = require('../controllers/gerenciarUsuariosController');


router.get('/perfil', authAdmin, (req, res) => {
  return res.status(200).json({
    mensagem: 'Acesso de administrador liberado.',
    usuario: req.usuario
  });
});

router.post('/usuarios', authAdmin, adminController.criarAdministrador);
router.get('/usuarios', authAdmin, gerenciarUsuariosController.listar);
router.put('/usuarios/:id', authAdmin, gerenciarUsuariosController.atualizar);
router.delete('/usuarios/:id', authAdmin, gerenciarUsuariosController.excluir);
router.use(require('./adminAlertasRoutes'));
module.exports = router;