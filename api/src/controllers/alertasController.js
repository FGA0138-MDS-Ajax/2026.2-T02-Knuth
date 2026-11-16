const alertasService = require('../services/alertasService');

class AlertasController {
  // GET /api/v1/alertas
  async getAlertasVigentes(req, res) {
    try {
      const data = await alertasService.listarAlertasVigentes();
      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro ao listar alertas vigentes:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao listar os alertas vigentes.'
      });
    }
  }

  // GET /api/v1/alertas/:id
  async getAlertaVigenteById(req, res) {
    try {
      const { id } = req.params || {};

      if (!id || String(id).trim() === '') {
        return res.status(400).json({
          erro: 'BAD_REQUEST',
          detalhes: 'O ID do alerta é obrigatório.'
        });
      }

      const data = await alertasService.obterAlertaVigente(id);

      if (!data) {
        return res.status(404).json({
          erro: 'NOT_FOUND',
          detalhes: 'Alerta vigente não encontrado para o ID informado.'
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro ao consultar alerta vigente:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao consultar o alerta vigente.'
      });
    }
  }
}

module.exports = new AlertasController();
