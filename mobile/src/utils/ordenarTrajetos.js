export const CRITERIOS_ORDENACAO = Object.freeze({
  TEMPO: 'TEMPO',
  BALDEACOES: 'BALDEACOES',
  CAMINHADA: 'CAMINHADA',
});

export const OPCOES_ORDENACAO = [
  { id: CRITERIOS_ORDENACAO.TEMPO, label: 'Menor tempo', seloMelhor: 'Mais rápida' },
  {
    id: CRITERIOS_ORDENACAO.BALDEACOES,
    label: 'Menos baldeações',
    seloMelhor: 'Menos baldeações',
  },
  { id: CRITERIOS_ORDENACAO.CAMINHADA, label: 'Menor caminhada', seloMelhor: 'Menor caminhada' },
];

function valorNumerico(valor, padrao = Number.POSITIVE_INFINITY) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function compararPartidas(a, b) {
  const partidaA = typeof a?.partida === 'string' ? a.partida : '';
  const partidaB = typeof b?.partida === 'string' ? b.partida : '';
  return partidaA.localeCompare(partidaB);
}

const COMPARADORES = {
  [CRITERIOS_ORDENACAO.TEMPO]: (a, b) =>
    valorNumerico(a?.duracaoMinutos) - valorNumerico(b?.duracaoMinutos) ||
    valorNumerico(a?.baldeacoes) - valorNumerico(b?.baldeacoes) ||
    valorNumerico(a?.caminhadaMetros, 0) - valorNumerico(b?.caminhadaMetros, 0) ||
    compararPartidas(a, b),
  [CRITERIOS_ORDENACAO.BALDEACOES]: (a, b) =>
    valorNumerico(a?.baldeacoes) - valorNumerico(b?.baldeacoes) ||
    valorNumerico(a?.duracaoMinutos) - valorNumerico(b?.duracaoMinutos) ||
    valorNumerico(a?.caminhadaMetros, 0) - valorNumerico(b?.caminhadaMetros, 0) ||
    compararPartidas(a, b),
  [CRITERIOS_ORDENACAO.CAMINHADA]: (a, b) =>
    valorNumerico(a?.caminhadaMetros, 0) - valorNumerico(b?.caminhadaMetros, 0) ||
    valorNumerico(a?.duracaoMinutos) - valorNumerico(b?.duracaoMinutos) ||
    valorNumerico(a?.baldeacoes) - valorNumerico(b?.baldeacoes) ||
    compararPartidas(a, b),
};

export function ordenarEFiltrarTrajetos(
  opcoes,
  { criterio = null, somenteDiretos = false } = {}
) {
  if (!Array.isArray(opcoes)) {
    return [];
  }

  let lista = somenteDiretos
    ? opcoes.filter((item) => Number(item?.baldeacoes) === 0)
    : [...opcoes];

  const comparador = criterio ? COMPARADORES[criterio] : null;
  if (comparador) {
    lista = [...lista].sort(comparador);
  }

  return lista;
}

export function formatarCaminhada(metros) {
  if (metros === null || metros === undefined || metros === '') {
    return null;
  }
  const valor = Number(metros);
  if (!Number.isFinite(valor) || valor < 0) {
    return null;
  }
  const arredondado = Math.round(valor);
  if (arredondado === 0) {
    return 'Sem caminhada';
  }
  if (arredondado < 1000) {
    return `${arredondado} m a pé`;
  }
  return `${(arredondado / 1000).toFixed(1).replace('.', ',')} km a pé`;
}

export function obterSeloMelhorOpcao(criterio) {
  const encontrado = OPCOES_ORDENACAO.find((item) => item.id === criterio);
  return encontrado ? encontrado.seloMelhor : null;
}
