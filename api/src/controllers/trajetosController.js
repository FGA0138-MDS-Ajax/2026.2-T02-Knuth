const trajetosService = require('../services/trajetosService');

class TrajetosController {
  async getTrajetos(req, res) {
    try {
      const { origem, destino } = req.query;

      if (!origem || !destino) {
        return res.status(400).json({
          erro: 'BAD_REQUEST',
          detalhes: 'Os parâmetros origem e destino são obrigatórios.'
        });
      }

      const data = await trajetosService.obterTrajetos(origem, destino);
      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro na busca de trajetos:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao calcular trajetos.'
      });
    }
  }
}

module.exports = new TrajetosController();