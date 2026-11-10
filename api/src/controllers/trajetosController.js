const trajetosService = require('../services/trajetosService');

class TrajetosController {
  async buscar(req, res) {
    try {
      const { origem_lat, origem_lng, destino_lat, destino_lng, criterio } = req.query;

      if (!origem_lat || !origem_lng || !destino_lat || !destino_lng) {
        return res.status(400).json({
          erro: "Parâmetros inválidos.",
          detalhes: "As coordenadas de origem (lat/lng) e destino (lat/lng) são obrigatórias."
        });
      }

      const opcoesTrajeto = await trajetosService.buscar({ 
        origem_lat, origem_lng, destino_lat, destino_lng, criterio 
      });

      return res.status(200).json(opcoesTrajeto);

    } catch (error) {
      console.error("Erro no Controlador de Trajetos:", error);
      return res.status(500).json({
        erro: "Erro interno do servidor.",
        detalhes: "Não foi possível calcular as opções de trajeto no momento."
      });
    }
  }
}

module.exports = new TrajetosController();