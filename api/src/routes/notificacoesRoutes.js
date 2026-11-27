const express = require('express');
const authUsuario = require('../middlewares/authUsuario');
const notificacoesController = require('../controllers/notificacoesController');

const router = express.Router();

router.get('/', authUsuario, notificacoesController.listar);
router.get('/nao-lidas', authUsuario, notificacoesController.contarNaoLidas);
router.put('/:id/lida', authUsuario, notificacoesController.marcarComoLida);

module.exports = router;
