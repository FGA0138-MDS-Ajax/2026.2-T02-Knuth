const CriterioOrdenacao = Object.freeze({
  TEMPO: 'TEMPO',
  BALDEACOES: 'BALDEACOES',
  CAMINHADA: 'CAMINHADA',
});

function valorNumerico(valor, padrao = Number.POSITIVE_INFINITY) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function compararPartidas(a, b) {
  const partidaA = typeof a?.partida === 'string' ? a.partida : '';
  const partidaB = typeof b?.partida === 'string' ? b.partida : '';
  return partidaA.localeCompare(partidaB);
}

class EstrategiaOrdenacao {
  comparar(_a, _b) {
    throw new Error('Método comparar() deve ser implementado pela subclasse.');
  }

  ordenar(opcoes) {
    if (!Array.isArray(opcoes)) {
      return [];
    }
    return [...opcoes].sort((a, b) => this.comparar(a, b));
  }
}

class EstrategiaMenorTempo extends EstrategiaOrdenacao {
  comparar(a, b) {
    return (
      valorNumerico(a?.duracaoMinutos) - valorNumerico(b?.duracaoMinutos) ||
      valorNumerico(a?.baldeacoes) - valorNumerico(b?.baldeacoes) ||
      valorNumerico(a?.caminhadaMetros, 0) - valorNumerico(b?.caminhadaMetros, 0) ||
      compararPartidas(a, b)
    );
  }
}

class EstrategiaMenosBaldeacoes extends EstrategiaOrdenacao {
  comparar(a, b) {
    return (
      valorNumerico(a?.baldeacoes) - valorNumerico(b?.baldeacoes) ||
      valorNumerico(a?.duracaoMinutos) - valorNumerico(b?.duracaoMinutos) ||
      valorNumerico(a?.caminhadaMetros, 0) - valorNumerico(b?.caminhadaMetros, 0) ||
      compararPartidas(a, b)
    );
  }
}

class EstrategiaMenorCaminhada extends EstrategiaOrdenacao {
  comparar(a, b) {
    return (
      valorNumerico(a?.caminhadaMetros, 0) - valorNumerico(b?.caminhadaMetros, 0) ||
      valorNumerico(a?.duracaoMinutos) - valorNumerico(b?.duracaoMinutos) ||
      valorNumerico(a?.baldeacoes) - valorNumerico(b?.baldeacoes) ||
      compararPartidas(a, b)
    );
  }
}

const ESTRATEGIAS = Object.freeze({
  [CriterioOrdenacao.TEMPO]: new EstrategiaMenorTempo(),
  [CriterioOrdenacao.BALDEACOES]: new EstrategiaMenosBaldeacoes(),
  [CriterioOrdenacao.CAMINHADA]: new EstrategiaMenorCaminhada(),
});

function normalizarCriterioOrdenacao(valor) {
  if (valor === undefined || valor === null) {
    return null;
  }
  const limpo = String(valor).trim().toUpperCase();
  if (!limpo) {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(ESTRATEGIAS, limpo) ? limpo : null;
}

function obterEstrategiaOrdenacao(criterio) {
  const normalizado = normalizarCriterioOrdenacao(criterio);
  return normalizado ? ESTRATEGIAS[normalizado] : null;
}

function ordenarOpcoesTrajeto(opcoes, criterio) {
  if (!Array.isArray(opcoes)) {
    return [];
  }
  const estrategia = obterEstrategiaOrdenacao(criterio);
  if (!estrategia) {
    return [...opcoes];
  }
  return estrategia.ordenar(opcoes);
}

module.exports = {
  CriterioOrdenacao,
  EstrategiaOrdenacao,
  EstrategiaMenorTempo,
  EstrategiaMenosBaldeacoes,
  EstrategiaMenorCaminhada,
  normalizarCriterioOrdenacao,
  obterEstrategiaOrdenacao,
  ordenarOpcoesTrajeto,
};
