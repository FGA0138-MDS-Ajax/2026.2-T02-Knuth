const express = require('express');
const router = express.Router();
const linhasController = require('../controllers/linhasController');

// RF02 / Busca: Rota base para consulta e filtragem de linhas (bacia, regiao, tipo, busca)
router.get('/', linhasController.getLinhas);

// RF08: Rota do Itinerário por ID
router.get('/:id/itinerario', linhasController.getItinerario);

// RF10: Rota do Quadro de Horários por ID
router.get('/:id/horarios', linhasController.getHorarios);

module.exports = router;