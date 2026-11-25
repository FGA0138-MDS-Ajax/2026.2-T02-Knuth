const paradasService = require('../services/paradasService');
const alertasService = require('../services/alertasService');

class ParadasController {
  async buscarParadas(req, res) {
    try {
      const { busca = '', limite } = req.query;
      const paradas = await paradasService.buscarParadas(busca, limite);
      return res.status(200).json(paradas);
    } catch (error) {
      console.error('Erro ao buscar paradas:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar paradas.',
      });
    }
  }

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

      let alertas = [];
      try {
        const encontrados = await alertasService.vigentesPara([], [data.id, data.codigo]);
        alertas = Array.isArray(encontrados) ? encontrados : [];
      } catch (erroAlerta) {
        console.error('Erro ao consultar alertas da parada:', erroAlerta);
      }

      return res.status(200).json({
        ...data,
        afetadaPorAlerta: alertas.length > 0,
        alertas,
      });
    } catch (error) {
      console.error('Erro ao buscar parada próxima:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar parada próxima.'
      });
    }
  }

  async getProximasPartidas(req, res) {
    try {
      const { id } = req.params || {};
      const { horario, tipoDia, limite } = req.query || {};

      if (!id || !String(id).trim()) {
        return res.status(400).json({
          erro: 'BAD_REQUEST',
          detalhes: 'O identificador da parada é obrigatório.',
        });
      }

      const resultado = await paradasService.obterProximasPartidas(id, {
        horario,
        tipoDia,
        limite,
      });

      if (!resultado) {
        return res.status(404).json({
          erro: 'NOT_FOUND',
          detalhes: 'Parada não encontrada.',
        });
      }

      let alertas = [];
      try {
        const encontrados = await alertasService.vigentesPara(
          [],
          [resultado.parada.id, resultado.parada.codigo]
        );
        alertas = Array.isArray(encontrados) ? encontrados : [];
      } catch (erroAlerta) {
        console.error('Erro ao consultar alertas da parada:', erroAlerta);
      }

      return res.status(200).json({
        ...resultado,
        afetadaPorAlerta: alertas.length > 0,
        alertas,
      });
    } catch (error) {
      if (error && error.status === 400) {
        return res.status(400).json({
          erro: error.erro || 'BAD_REQUEST',
          detalhes: error.detalhes || error.message,
        });
      }
      console.error('Erro ao buscar próximas partidas da parada:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar próximas partidas da parada.',
      });
    }
  }
}

module.exports = new ParadasController();
