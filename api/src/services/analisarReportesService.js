const repo = require('../repositories/analisarReportesRepository');

const STATUS_VALIDOS = ['PENDENTE', 'PROCEDENTE', 'IMPROCEDENTE'];
const TIPOS_VALIDOS = ['HORARIO', 'PARADA', 'ITINERARIO'];

function erroComStatus(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function normalizarId(id) {
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw erroComStatus('ID do reporte inválido.', 400);
  }
  return numero;
}

// RF24 - Regras de negócio para listagem, classificação e registro de correção de reportes
class AnalisarReportesService {
  async listar({ status, tipo } = {}) {
    let statusNormalizado;
    if (status !== undefined && status !== null && String(status).trim() !== '') {
      statusNormalizado = String(status).trim().toUpperCase();
      if (!STATUS_VALIDOS.includes(statusNormalizado)) {
        throw erroComStatus(
          'Status inválido. Use: PENDENTE, PROCEDENTE ou IMPROCEDENTE.',
          400
        );
      }
    }

    let tipoNormalizado;
    if (tipo !== undefined && tipo !== null && String(tipo).trim() !== '') {
      tipoNormalizado = String(tipo).trim().toUpperCase();
      if (!TIPOS_VALIDOS.includes(tipoNormalizado)) {
        throw erroComStatus(
          'Tipo de divergência inválido. Use: HORARIO, PARADA ou ITINERARIO.',
          400
        );
      }
    }

    return await repo.listar({ status: statusNormalizado, tipo: tipoNormalizado });
  }

  async obterPorId(id) {
    const idValido = normalizarId(id);
    const reporte = await repo.buscarPorId(idValido);
    if (!reporte) {
      throw erroComStatus('Reporte não encontrado.', 404);
    }
    return reporte;
  }

  async analisar(id, { status, observacaoAdmin, correcaoRealizada } = {}) {
    const idValido = normalizarId(id);

    const statusNormalizado =
      typeof status === 'string' ? status.trim().toUpperCase() : '';
    if (!STATUS_VALIDOS.includes(statusNormalizado)) {
      throw erroComStatus(
        'Status inválido. Use: PENDENTE, PROCEDENTE ou IMPROCEDENTE.',
        400
      );
    }

    const textoBruto =
      observacaoAdmin !== undefined ? observacaoAdmin : correcaoRealizada;
    const observacaoLimpa =
      typeof textoBruto === 'string' ? textoBruto.trim() : '';

    if (statusNormalizado === 'PROCEDENTE' && !observacaoLimpa) {
      throw erroComStatus(
        'Informe a correção realizada ao classificar o reporte como procedente.',
        400
      );
    }

    const existente = await repo.buscarPorId(idValido);
    if (!existente) {
      throw erroComStatus('Reporte não encontrado.', 404);
    }

    return await repo.atualizarAnalise(
      idValido,
      statusNormalizado,
      observacaoLimpa || null
    );
  }
}

module.exports = new AnalisarReportesService();
