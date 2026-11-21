export function formatarDuracao(minutos) {
  const total = Math.max(Math.round(Number(minutos) || 0), 0);
  if (total < 60) {
    return `${total} min`;
  }

  const horas = Math.floor(total / 60);
  const resto = total % 60;

  if (resto === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${String(resto).padStart(2, '0')}min`;
}

export default formatarDuracao;
