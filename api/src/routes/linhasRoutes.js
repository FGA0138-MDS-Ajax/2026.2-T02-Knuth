const express = require('express');
const router = express.Router();
const linhasController = require('../controllers/linhasController');

// RF07 - Busca de Linhas
router.get('/', linhasController.getLinhas);

// RF08 - Itinerário da Linha
router.get('/:id/itinerario', linhasController.getItinerario);

// RF10 - Quadro de Horários da Linha
router.get('/:id/horarios', linhasController.getHorarios);

module.exports = router;