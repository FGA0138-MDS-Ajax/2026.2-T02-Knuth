const express = require('express');
const router = express.Router();
const alertasController = require('../controllers/alertasController');

// RF13 - Consultar alertas de alteração vigentes
router.get('/', alertasController.getAlertasVigentes);
router.get('/:id', alertasController.getAlertaVigenteById);

module.exports = router;
