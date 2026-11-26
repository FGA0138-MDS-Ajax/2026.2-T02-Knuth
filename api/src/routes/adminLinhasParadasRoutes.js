const express = require('express');
const router = express.Router();
const authAdmin = require('../middlewares/authAdmin');
const manterLinhasParadasController = require('../controllers/manterLinhasParadasController');

router.post('/linhas', authAdmin, manterLinhasParadasController.criarLinha);
router.put('/linhas/:id', authAdmin, manterLinhasParadasController.editarLinha);
router.delete('/linhas/:id', authAdmin, manterLinhasParadasController.excluirLinha);

// A busca de paradas (GET /paradas) é a mesma usada no cadastro de alertas (adminAlertasRoutes)
router.get('/paradas/:id', authAdmin, manterLinhasParadasController.obterParada);
router.post('/paradas', authAdmin, manterLinhasParadasController.criarParada);
router.put('/paradas/:id', authAdmin, manterLinhasParadasController.editarParada);
router.delete('/paradas/:id', authAdmin, manterLinhasParadasController.excluirParada);

module.exports = router;
