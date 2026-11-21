const express = require('express');
const router = express.Router();
const reportesDivergenciaController = require('../controllers/reportesDivergenciaController');

router.post('/', (req, res) => reportesDivergenciaController.criar(req, res));

module.exports = router;