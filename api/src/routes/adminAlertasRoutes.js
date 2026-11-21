const express = require('express');
const router = express.Router();
const authAdmin = require('../middlewares/authAdmin');
const gerenciarAlertasController = require('../controllers/gerenciarAlertasController');

router.get('/alertas', authAdmin, gerenciarAlertasController.listar);
router.post('/alertas', authAdmin, gerenciarAlertasController.criar);
router.put('/alertas/:id/encerrar', authAdmin, gerenciarAlertasController.encerrar);
router.delete('/alertas/:id', authAdmin, gerenciarAlertasController.excluir);
router.put('/alertas/:id', authAdmin, gerenciarAlertasController.editar);
router.get('/paradas', authAdmin, gerenciarAlertasController.buscarParadas);

module.exports = router;
