const express = require('express');
const router = express.Router();
const buscasRecentesController = require('../controllers/buscasRecentesController');

router.post('/buscas-recentes', (req, res) => buscasRecentesController.salvar(req, res));
router.get('/buscas-recentes', (req, res) => buscasRecentesController.listar(req, res));

module.exports = router;