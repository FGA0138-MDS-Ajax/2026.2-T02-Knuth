const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const authUsuario = require('../middlewares/authUsuario');

router.post('/cadastro', usuariosController.cadastrar);
router.post('/login', usuariosController.login);

// RF16 - Recuperação de senha e exclusão da própria conta
router.post('/recuperar-senha', usuariosController.solicitarRecuperacaoSenha);
router.post('/redefinir-senha', usuariosController.redefinirSenha);
router.delete('/me', authUsuario, usuariosController.excluirConta);

module.exports = router;
