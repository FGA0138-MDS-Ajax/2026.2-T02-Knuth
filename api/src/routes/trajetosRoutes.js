const express = require('express');
const router = express.Router();
const trajetosController = require('../controllers/trajetosController');

router.get('/', trajetosController.getTrajetos);

module.exports = router;