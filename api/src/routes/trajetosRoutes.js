const express = require('express');
const router = express.Router();
const trajetosController = require('../controllers/trajetosController');

router.get('/', trajetosController.buscar);

module.exports = router;