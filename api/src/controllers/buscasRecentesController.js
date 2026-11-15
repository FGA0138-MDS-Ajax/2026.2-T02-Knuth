const buscasRecentesService = require('../services/buscasRecentesService');

class BuscasRecentesController {
  async salvar(req, res) {
    try {
      const { origem, destino, usuarioId } = req.body;
      const novaBusca = await buscasRecentesService.registrarBusca(origem, destino, usuarioId);
      return res.status(201).json(novaBusca);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }

  async listar(req, res) {
    try {
      const { usuarioId, limite } = req.query;
      const buscas = await buscasRecentesService.obterBuscasRecentes(usuarioId, limite);
      return res.status(200).json(buscas);
    } catch (error) {
      return res.status(500).json({ erro: 'Erro interno ao consultar buscas recentes.' });
    }
  }
}

module.exports = new BuscasRecentesController();