const reportesDivergenciaService = require('../services/reportesDivergenciaService');

const MENSAGENS_VALIDACAO = [
  'Tipo de divergência inválido. Use: HORARIO, PARADA ou ITINERARIO.',
  'A descrição da divergência deve ter pelo menos 10 caracteres.',
  'Informe ao menos a linha ou a parada relacionada à divergência.',
];

class ReportesDivergenciaController {
  async criar(req, res) {
    try {
      const { tipo, descricao, linhaId, paradaId, usuarioId } = req.body || {};
      const novoReporte = await reportesDivergenciaService.registrarReporte({
        tipo,
        descricao,
        linhaId,
        paradaId,
        usuarioId,
      });
      return res.status(201).json(novoReporte);
    } catch (error) {
      if (MENSAGENS_VALIDACAO.includes(error.message)) {
        return res.status(400).json({ erro: error.message });
      }
      return res.status(500).json({ erro: 'Erro interno ao registrar reporte de divergência.' });
    }
  }
}

module.exports = new ReportesDivergenciaController();