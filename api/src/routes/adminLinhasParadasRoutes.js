const express = require('express');
const router = express.Router();
const authAdmin = require('../middlewares/authAdmin');
const manterLinhasParadasController = require('../controllers/manterLinhasParadasController');

router.post('/linhas', authAdmin, manterLinhasParadasController.criarLinha);
router.put('/linhas/:id', authAdmin, manterLinhasParadasController.editarLinha);
router.delete('/linhas/:id', authAdmin, manterLinhasParadasController.excluirLinha);

module.exports = router;
