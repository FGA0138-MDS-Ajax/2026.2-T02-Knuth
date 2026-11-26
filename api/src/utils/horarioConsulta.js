const ReferenciaHorario = Object.freeze({
  PARTIDA: 'PARTIDA',
  CHEGADA: 'CHEGADA',
});

const REGEX_HORARIO = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

function normalizarHorario(valor) {
  if (valor === undefined || valor === null) {
    return null;
  }
  const limpo = String(valor).trim();
  const match = REGEX_HORARIO.exec(limpo);
  if (!match) {
    return null;
  }

  const hora = Number(match[1]);
  const minuto = Number(match[2]);
  const segundo = match[3] !== undefined ? Number(match[3]) : 0;

  if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59 || segundo < 0 || segundo > 59) {
    return null;
  }

  return `${match[1]}:${match[2]}:${match[3] !== undefined ? match[3] : '00'}`;
}

function normalizarReferenciaHorario(valor) {
  if (valor === undefined || valor === null) {
    return null;
  }
  const limpo = String(valor).trim().toUpperCase();
  if (!limpo) {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(ReferenciaHorario, limpo) ? limpo : null;
}

function interpretarFiltroHorario({ horario, referenciaHorario } = {}) {
  const temHorario = horario !== undefined && horario !== null && String(horario).trim() !== '';
  const temReferencia =
    referenciaHorario !== undefined &&
    referenciaHorario !== null &&
    String(referenciaHorario).trim() !== '';

  if (!temHorario && !temReferencia) {
    return { filtro: null, erro: null };
  }

  if (!temHorario && temReferencia) {
    return {
      filtro: null,
      erro: 'Informe o parâmetro horario (HH:MM) junto com referenciaHorario.',
    };
  }

  const horarioNormalizado = normalizarHorario(horario);
  if (!horarioNormalizado) {
    return {
      filtro: null,
      erro: 'Parâmetro horario inválido. Use o formato HH:MM (ex.: 08:30).',
    };
  }

  let referencia = ReferenciaHorario.PARTIDA;
  if (temReferencia) {
    referencia = normalizarReferenciaHorario(referenciaHorario);
    if (!referencia) {
      return {
        filtro: null,
        erro: 'Parâmetro referenciaHorario inválido. Use PARTIDA ou CHEGADA.',
      };
    }
  }

  return {
    filtro: {
      referencia,
      horario: horarioNormalizado,
    },
    erro: null,
  };
}

module.exports = {
  ReferenciaHorario,
  normalizarHorario,
  normalizarReferenciaHorario,
  interpretarFiltroHorario,
};
