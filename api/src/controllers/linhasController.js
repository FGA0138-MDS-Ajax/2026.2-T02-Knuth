const linhasService = require('../services/linhasService');

class LinhasController {
  async getItinerario(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(Number(id))) {
        return res.status(400).json({
          codigo: 'BAD_REQUEST',
          mensagem: 'O ID da linha deve ser um número válido.'
        });
      }

      const data = await linhasService.obterItinerario(id);

      if (!data) {
        return res.status(404).json({
          codigo: 'NOT_FOUND',
          mensagem: 'Itinerário não encontrado para a linha informada.'
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro na consulta do itinerario:', error);
      return res.status(500).json({
        codigo: 'INTERNAL_ERROR',
        mensagem: 'Erro interno ao consultar o itinerário.'
      });
    }
  }

  async getHorarios(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(Number(id))) {
        return res.status(400).json({
          codigo: 'BAD_REQUEST',
          mensagem: 'O ID da linha deve ser um número válido.'
        });
      }

      const data = await linhasService.obterQuadroHorarios(id);

      if (!data) {
        return res.status(404).json({
          codigo: 'NOT_FOUND',
          mensagem: 'Quadro de horários não encontrado para a linha informada.'
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro na consulta de horarios:', error);
      return res.status(500).json({
        codigo: 'INTERNAL_ERROR',
        mensagem: 'Erro interno ao consultar o quadro de horários.'
      });
    }
  }
}

module.exports = new LinhasController();