const alertasService = require('../services/alertasService');

function parseParametroLista(valor) {
  if (!valor) return [];
  if (Array.isArray(valor)) {
    return valor.flatMap((v) => String(v).split(',')).map((v) => v.trim()).filter(Boolean);
  }
  return String(valor).split(',').map((v) => v.trim()).filter(Boolean);
}

class AlertasController {
  // GET /api/v1/alertas (opcionalmente ?linhaId=...&paradaId=...)
  async getAlertasVigentes(req, res) {
    try {
      const { linhaId, paradaId } = req.query || {};
      const linhas = parseParametroLista(linhaId);
      const paradas = parseParametroLista(paradaId);

      const data =
        linhas.length > 0 || paradas.length > 0
          ? await alertasService.vigentesPara(linhas, paradas)
          : await alertasService.listarAlertasVigentes();

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
