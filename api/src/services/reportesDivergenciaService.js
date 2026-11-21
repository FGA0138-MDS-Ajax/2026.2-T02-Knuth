const reportesDivergenciaRepository = require('../repositories/reportesDivergenciaRepository');

const TIPOS_VALIDOS = ['HORARIO', 'PARADA', 'ITINERARIO'];

class ReportesDivergenciaService {
  async registrarReporte({ tipo, descricao, linhaId = null, paradaId = null, usuarioId = null } = {}) {
    const tipoNormalizado = typeof tipo === 'string' ? tipo.trim().toUpperCase() : '';
    if (!TIPOS_VALIDOS.includes(tipoNormalizado)) {
      throw new Error('Tipo de divergência inválido. Use: HORARIO, PARADA ou ITINERARIO.');
    }

    const descricaoLimpa = typeof descricao === 'string' ? descricao.trim() : '';
    if (descricaoLimpa.length < 10) {
      throw new Error('A descrição da divergência deve ter pelo menos 10 caracteres.');
    }

    const linhaNormalizada =
      linhaId !== undefined && linhaId !== null && String(linhaId).trim() !== ''
        ? String(linhaId).trim()
        : null;

    const paradaNormalizada =
      paradaId !== undefined && paradaId !== null && String(paradaId).trim() !== ''
        ? String(paradaId).trim()
        : null;

    if (!linhaNormalizada && !paradaNormalizada) {
      throw new Error('Informe ao menos a linha ou a parada relacionada à divergência.');
    }

    const usuarioNormalizado =
      usuarioId !== undefined && usuarioId !== null && !Number.isNaN(Number(usuarioId))
        ? Number(usuarioId)
        : null;

    return await reportesDivergenciaRepository.criar({
      tipo: tipoNormalizado,
      descricao: descricaoLimpa,
      linhaId: linhaNormalizada,
      paradaId: paradaNormalizada,
      usuarioId: usuarioNormalizado,
    });
  }
}

module.exports = new ReportesDivergenciaService();