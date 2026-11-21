const ACENTOS_ORIGEM = 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç';
const ACENTOS_DESTINO = 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc';

const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'ao', 'aos',
  'de', 'da', 'do', 'das', 'dos',
  'e', 'em', 'na', 'no', 'nas', 'nos',
  'para', 'por', 'com', 'pela', 'pelo',
]);

function sqlNormalizarColuna(coluna) {
  return `LOWER(translate(${coluna}, '${ACENTOS_ORIGEM}', '${ACENTOS_DESTINO}'))`;
}

function normalizarTexto(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function prepararTermosBusca(texto) {
  const termoNormalizado = normalizarTexto(texto);
  if (!termoNormalizado) {
    return {
      termoNormalizado: '',
      tokens: [],
      gruposAlternativos: [],
    };
  }

  const tokensBrutos = termoNormalizado
    .replace(/[^a-z0-9.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const tokens = tokensBrutos.filter(
    (token) => !STOPWORDS.has(token) && (token.length >= 2 || /^\d+$/.test(token))
  );

  const tokensEfetivos = tokens.length > 0 ? tokens : tokensBrutos;

  const gruposAlternativos = [];
  const temRodoviaria = termoNormalizado.includes('rodoviaria');
  const temPlanoPiloto =
    termoNormalizado.includes('plano piloto') || termoNormalizado.includes('rod.pp');

  if (temRodoviaria && temPlanoPiloto) {
    gruposAlternativos.push(['rodoviaria', 'rod.pp']);
    gruposAlternativos.push(['plataforma', 'rodoviaria']);
    gruposAlternativos.push(['rodoviaria']);
  } else if (temRodoviaria) {
    gruposAlternativos.push(['rodoviaria', 'rod.pp']);
    gruposAlternativos.push(['rodoviaria']);
  } else if (termoNormalizado.includes('esplanada')) {
    gruposAlternativos.push(['esplanada']);
    gruposAlternativos.push(['ministerio']);
  }

  return {
    termoNormalizado,
    tokens: tokensEfetivos,
    gruposAlternativos,
  };
}

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function criarCondicaoToken(colunaNormalizada, token, params) {
  if (token.length <= 3) {
    params.push(`(^|[^a-z0-9])${escaparRegex(token)}([^a-z0-9]|$)`);
    return `${colunaNormalizada} ~ $${params.length}`;
  }
  params.push(`%${token}%`);
  return `${colunaNormalizada} LIKE $${params.length}`;
}

module.exports = {
  ACENTOS_ORIGEM,
  ACENTOS_DESTINO,
  sqlNormalizarColuna,
  normalizarTexto,
  prepararTermosBusca,
  criarCondicaoToken,
};
