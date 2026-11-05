const linhasService = require('../services/linhasService');

class LinhasController {
  async getItinerario(req, res) {
    try {
      const { id } = req.params;
      const data = await linhasService.obterItinerario(id);

      if (!data) {
        return res.status(404).json({
          codigo: 'NOT_FOUND',
          mensagem: 'Itinerário não encontrado para a linha informada.'
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro na consulta do itinerario:', error); // Exibe o erro no terminal
      return res.status(500).json({
        codigo: 'INTERNAL_ERROR',
        mensagem: 'Erro interno ao consultar o itinerário.'
      });
    }
  }

  async getHorarios(req, res) {
    try {
      const { id } = req.params;
      const data = await linhasService.obterQuadroHorarios(id);

      if (!data) {
        return res.status(404).json({
          codigo: 'NOT_FOUND',
          mensagem: 'Quadro de horários não encontrado para a linha informada.'
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro na consulta de horarios:', error); // Exibe o erro no terminal
      return res.status(500).json({
        codigo: 'INTERNAL_ERROR',
        mensagem: 'Erro interno ao consultar o quadro de horários.'
      });
    }
  }
}

module.exports = new LinhasController();