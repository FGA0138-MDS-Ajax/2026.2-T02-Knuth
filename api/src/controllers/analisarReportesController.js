const analisarReportesService = require('../services/analisarReportesService');

const CODIGOS_ERRO = {
  400: 'BAD_REQUEST',
  404: 'NOT_FOUND',
};

function responderErro(res, error, mensagemInterna) {
  if (error.status && CODIGOS_ERRO[error.status]) {
    return res.status(error.status).json({
      erro: CODIGOS_ERRO[error.status],
      detalhes: error.message,
    });
  }

  console.error(mensagemInterna, error);
  return res.status(500).json({ erro: 'INTERNAL_ERROR', detalhes: mensagemInterna });
}

// RF24 - Controlador administrativo para análise de reportes de divergência
class AnalisarReportesController {
  // GET /api/v1/admin/reportes
  async listar(req, res) {
    try {
      const { status, tipo } = req.query || {};
      const reportes = await analisarReportesService.listar({ status, tipo });
      return res.status(200).json(reportes);
    } catch (error) {
      return responderErro(res, error, 'Erro interno ao listar os reportes.');
    }
  }

  // GET /api/v1/admin/reportes/:id
  async obterPorId(req, res) {
    try {
      const reporte = await analisarReportesService.obterPorId(req.params.id);
      return res.status(200).json(reporte);
    } catch (error) {
      return responderErro(res, error, 'Erro interno ao consultar o reporte.');
    }
  }

  // PATCH /api/v1/admin/reportes/:id
  async analisar(req, res) {
    try {
      const { status, observacaoAdmin, correcaoRealizada } = req.body || {};
      const atualizado = await analisarReportesService.analisar(req.params.id, {
        status,
        observacaoAdmin,
        correcaoRealizada,
      });
      return res.status(200).json(atualizado);
    } catch (error) {
      return responderErro(res, error, 'Erro interno ao atualizar a análise do reporte.');
    }
  }
}

module.exports = new AnalisarReportesController();
