const express = require('express');
const router = express.Router();
const linhasController = require('../controllers/linhasController');

router.get('/:id/itinerario', linhasController.getItinerario);
router.get('/:id/horarios', linhasController.getHorarios);

module.exports = router;