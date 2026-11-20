const linhasService = require('../services/linhasService');
const alertasService = require('../services/alertasService');

async function consultarAlertasSeguro(fn) {
  try {
    const resultado = await fn();
    return Array.isArray(resultado) ? resultado : [];
  } catch (error) {
    console.error('Erro ao consultar alertas para sinalização:', error);
    return [];
  }
}

class LinhasController {
  async getLinhas(req, res) {
    try {
      const { busca, bacia, regiao, tipo } = req.query || {};
      const filtros = (bacia !== undefined || regiao !== undefined || tipo !== undefined)
        ? { busca, bacia, regiao, tipo }
        : busca;
      const data = await linhasService.obterLinhas(filtros);

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(200).json(data);
      }

      const alertasVigentes = await consultarAlertasSeguro(() =>
        alertasService.listarAlertasVigentes()
      );

      const linhasComAlertas = data.map((linha) => {
        const alertas = alertasService.filtrarAlertasParaItens(alertasVigentes, {
          linhasIds: [linha.id, linha.codigo],
        });
        return {
          ...linha,
          afetadaPorAlerta: alertas.length > 0,
          alertas,
        };
      });

      return res.status(200).json(linhasComAlertas);
    } catch (error) {
      console.error('Erro na busca de linhas:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao buscar linhas.'
      });
    }
  }

  async getItinerario(req, res) {
    try {
      const { id } = req.params || {};

      if (!id || String(id).trim() === '' || !/^[0-9.]+$/.test(String(id).trim())) {
        return res.status(400).json({
          erro: 'BAD_REQUEST',
          detalhes: 'O ID da linha é obrigatório.'
        });
      }

      const data = await linhasService.obterItinerario(id);

      if (!data) {
        return res.status(404).json({
          erro: 'NOT_FOUND',
          detalhes: 'Itinerário não encontrado para a linha informada.'
        });
      }

      const paradasIda = Array.isArray(data.itinerario?.IDA) ? data.itinerario.IDA : [];
      const paradasVolta = Array.isArray(data.itinerario?.VOLTA) ? data.itinerario.VOLTA : [];
      const paradasIds = [...paradasIda, ...paradasVolta]
        .flatMap((p) => [p.paradaId, p.codigo])
        .filter((v) => v !== undefined && v !== null);

      const alertasVigentes = await consultarAlertasSeguro(() =>
        alertasService.vigentesPara([id, data.codigo], paradasIds)
      );

      const alertasLinha = alertasService.filtrarAlertasParaItens(alertasVigentes, {
        linhasIds: [id, data.codigo],
      });

      const enriquecerParada = (parada) => {
        const alertas = alertasService.filtrarAlertasParaItens(alertasVigentes, {
          paradasIds: [parada.paradaId, parada.codigo],
          paradasNomes: [parada.nome],
        });
        return {
          ...parada,
          afetadaPorAlerta: alertas.length > 0,
          alertas,
        };
      };

      const resultado = {
        ...data,
        afetadaPorAlerta: alertasLinha.length > 0,
        alertas: alertasLinha,
        itinerario: {
          ...data.itinerario,
          IDA: paradasIda.map(enriquecerParada),
          VOLTA: paradasVolta.map(enriquecerParada),
        },
      };

      return res.status(200).json(resultado);
    } catch (error) {
      console.error('Erro na consulta do itinerario:', error);
      return res.status(500).json({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao consultar o itinerário.'
      });
    }
  }

  async getHorarios(req, res) {
    try {
      const { id } = req.params || {};

      if (!id || String(id).trim() === '') {
        return res.status(400).json({
          erro: 'BAD_REQUEST',
          detalhes: 'O ID da linha é obrigatório.'
        });
      }

      const data = await linhasService.obterQuadroHorarios(id);

      if (!data) {
        return res.status(404).json({
          erro: 'NOT_FOUND',
          detalhes: 'Quadro de horários não encontrado para a linha informada.'
        });
      }

      const alertasLinha = await consultarAlertasSeguro(() =>
        alertasService.vigentesPara([id, data.codigo], [])
      );

      return res.status(200).json({
        ...data,
        afetadaPorAlerta: alertasLinha.length > 0,
        alertas: alertasLinha,
      });
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
