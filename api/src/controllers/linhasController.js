const linhasService = require('../services/linhasService');

class LinhasController {
  
  // RF02 - Busca e Filtragem de Linhas (bacia, regiao, tipo, busca)
  async getLinhas(req, res) {
    try {
      const { busca } = req.query || {};
      const data = await linhasService.obterLinhas(busca);
      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro na busca de linhas:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar linhas.'
      });
    }
  }

  // RF08 - Itinerário
  async getItinerario(req, res) {
    try {
      const { id } = req.params || {};
      const { sentido = 'IDA' } = req.query || {}; 

      // Valida se o ID é nulo, vazio ou contém letras (isNaN)
      if (!id || String(id).trim() === '') {
        return res.status(400).json({
          erro: 'BAD_REQUEST',
          detalhes: 'O ID da linha é obrigatório.'
        });
      }

      const data = await linhasService.obterItinerario(id, sentido);

      if (!data || data.length === 0) {
        return res.status(404).json({
          erro: 'NOT_FOUND',
          detalhes: 'Itinerário não encontrado para a linha informada.'
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro na consulta do itinerario:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao consultar o itinerário.'
      });
    }
  }

  // RF10 - Quadro de Horários
  async getHorarios(req, res) {
    try {
      const { id } = req.params || {};
      const { sentido = 'IDA' } = req.query || {}; 

      // Valida se o ID é nulo, vazio ou contém letras (isNaN)
      if (!id || String(id).trim() === '') {
        return res.status(400).json({
          erro: 'BAD_REQUEST',
          detalhes: 'O ID da linha é obrigatório.'
        });
      }

      const data = await linhasService.obterQuadroHorarios(id, sentido);

      if (!data || data.length === 0) {
        return res.status(404).json({
          erro: 'NOT_FOUND',
          detalhes: 'Quadro de horários não encontrado para a linha informada.'
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro na consulta de horarios:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao consultar o quadro de horários.'
      });
    }
  }
}

module.exports = new LinhasController();