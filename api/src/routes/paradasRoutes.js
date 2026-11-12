const express = require('express');
const router = express.Router();
const paradasController = require('../controllers/paradasController');

router.get('/proximas', paradasController.getParadaProxima);

module.exports = router;