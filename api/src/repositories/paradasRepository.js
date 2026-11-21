const pool = require('../config/database');
const {
  sqlNormalizarColuna,
  prepararTermosBusca,
  criarCondicaoToken,
} = require('../utils/normalizacaoBusca');

const COLUNA_NOME_NORM = sqlNormalizarColuna('nome');

class ParadasRepository {
  async findNearestParada(lat, lng) {
    const query = `
      SELECT id, nome, latitude, longitude,
      (6371 * 2 * asin(sqrt(
        power(sin(radians(latitude - $1) / 2), 2) + 
        cos(radians($1)) * cos(radians(latitude)) * power(sin(radians(longitude - $2) / 2), 2)
      ))) AS distancia
      FROM paradas
      ORDER BY distancia ASC
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [lat, lng]);
    return rows[0] || null;
  }

  async buscarPorNome(termo, limite = 10) {
    const { termoNormalizado, tokens, gruposAlternativos } = prepararTermosBusca(termo);
    if (!termoNormalizado) {
      return [];
    }

    const params = [termoNormalizado, `%${termoNormalizado}%`];
    const condicoesGrupos = [`${COLUNA_NOME_NORM} LIKE $2`];

    const adicionarGrupoTokens = (listaTokens) => {
      if (!listaTokens || listaTokens.length === 0) return;
      const partes = listaTokens.map((token) =>
        criarCondicaoToken(COLUNA_NOME_NORM, token, params)
      );
      condicoesGrupos.push(`(${partes.join(' AND ')})`);
    };

    adicionarGrupoTokens(tokens);
    for (const grupo of gruposAlternativos) {
      adicionarGrupoTokens(grupo);
    }

    params.push(limite);
    const limiteParam = `$${params.length}`;

    const prioridadeCasos = condicoesGrupos
      .map((condicao, idx) => `WHEN ${condicao} THEN ${idx + 1}`)
      .join(' ');

    const wrappedQuery = `
      SELECT id, nome, latitude, longitude
      FROM (
        SELECT
          id,
          nome,
          latitude,
          longitude,
          CASE
            WHEN ${COLUNA_NOME_NORM} = $1 THEN 0
            ${prioridadeCasos}
            ELSE 99
          END AS prioridade
        FROM paradas
        WHERE ${condicoesGrupos.join(' OR ')}
      ) candidatos
      ORDER BY prioridade ASC, LENGTH(nome) ASC, nome ASC
      LIMIT ${limiteParam};
    `;

    const { rows } = await pool.query(wrappedQuery, params);
    return rows;
  }
}

module.exports = new ParadasRepository();
