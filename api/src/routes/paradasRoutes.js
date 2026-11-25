const express = require('express');
const router = express.Router();
const paradasController = require('../controllers/paradasController');

router.get('/', paradasController.buscarParadas);
router.get('/proximas', paradasController.getParadaProxima);
router.get('/:id/proximas-partidas', paradasController.getProximasPartidas);

module.exports = router;
