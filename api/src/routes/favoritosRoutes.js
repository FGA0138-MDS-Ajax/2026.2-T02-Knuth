const express = require('express');
const router = express.Router();
const authUsuario = require('../middlewares/authUsuario');
const favoritosController = require('../controllers/favoritosController');

router.get('/', authUsuario, favoritosController.listar);
router.post('/', authUsuario, favoritosController.adicionar);
router.delete('/:id', authUsuario, favoritosController.remover);

module.exports = router;