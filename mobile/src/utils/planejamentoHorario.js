export const MODOS_HORARIO = Object.freeze({
  AGORA: 'AGORA',
  PARTIDA: 'PARTIDA',
  CHEGADA: 'CHEGADA',
});

export const OPCOES_MODO_HORARIO = [
  { id: MODOS_HORARIO.AGORA, label: 'Agora' },
  { id: MODOS_HORARIO.PARTIDA, label: 'Partida às' },
  { id: MODOS_HORARIO.CHEGADA, label: 'Chegada até' },
];

export const ATALHOS_HORARIO = ['07:00', '08:00', '12:00', '18:00'];

export function aplicarMascaraHorario(texto) {
  const digitos = String(texto || '')
    .replace(/\D/g, '')
    .slice(0, 4);
  if (digitos.length <= 2) {
    return digitos;
  }
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

export function validarHorarioTexto(texto) {
  const limpo = String(texto || '').trim();
  const match = /^(\d{2}):(\d{2})$/.exec(limpo);
  if (!match) {
    return null;
  }
  const hora = Number(match[1]);
  const minuto = Number(match[2]);
  if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
    return null;
  }
  return `${match[1]}:${match[2]}`;
}

export function formatarResumoPlanejamento(planejamento) {
  if (!planejamento || !planejamento.horario) {
    return null;
  }
  const horarioCurto = String(planejamento.horario).slice(0, 5);
  if (planejamento.referenciaHorario === MODOS_HORARIO.CHEGADA) {
    return `Chegada até ${horarioCurto}`;
  }
  if (planejamento.referenciaHorario === MODOS_HORARIO.PARTIDA) {
    return `Partida às ${horarioCurto}`;
  }
  return null;
}
