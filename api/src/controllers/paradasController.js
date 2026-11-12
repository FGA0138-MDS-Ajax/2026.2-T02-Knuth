const paradasService = require('../services/paradasService');

class ParadasController {
  async getParadaProxima(req, res) {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          erro: 'BAD_REQUEST',
          detalhes: 'Os parâmetros lat e lng são obrigatórios.'
        });
      }

      const data = await paradasService.obterParadaMaisProxima(lat, lng);

      if (!data) {
        return res.status(404).json({
          erro: 'NOT_FOUND',
          detalhes: 'Nenhuma parada encontrada próxima a esta localização.'
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro ao buscar parada próxima:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar parada próxima.'
      });
    }
  }
}

module.exports = new ParadasController();