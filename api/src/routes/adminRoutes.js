const express = require('express');
const router = express.Router();
const authAdmin = require('../middlewares/authAdmin');
const adminController = require('../controllers/adminController');
const gerenciarUsuariosController = require('../controllers/gerenciarUsuariosController');
const gerenciarAlertasController = require('../controllers/gerenciarAlertasController');

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
router.get('/alertas', authAdmin, gerenciarAlertasController.listar);
router.post('/alertas', authAdmin, gerenciarAlertasController.criar);
router.put('/alertas/:id/encerrar', authAdmin, gerenciarAlertasController.encerrar);
router.delete('/alertas/:id', authAdmin, gerenciarAlertasController.excluir);
router.put('/alertas/:id', authAdmin, gerenciarAlertasController.editar);
router.get('/paradas', authAdmin, gerenciarAlertasController.buscarParadas);

module.exports = router;