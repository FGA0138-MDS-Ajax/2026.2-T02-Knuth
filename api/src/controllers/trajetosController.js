const trajetosService = require('../services/trajetosService');
const alertasService = require('../services/alertasService');

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

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(200).json(data);
      }

      let alertasVigentes = [];
      try {
        const encontrados = await alertasService.listarAlertasVigentes();
        alertasVigentes = Array.isArray(encontrados) ? encontrados : [];
      } catch (erroAlerta) {
        console.error('Erro ao consultar alertas para trajetos:', erroAlerta);
      }

      const opcoesComAlertas = data.map((opcao) => {
        const itens = alertasService.extrairItensDoTrajeto(opcao);
        const alertas = alertasService.filtrarAlertasParaItens(alertasVigentes, itens);
        return {
          ...opcao,
          afetadaPorAlerta: alertas.length > 0,
          alertas,
        };
      });

      return res.status(200).json(opcoesComAlertas);
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
