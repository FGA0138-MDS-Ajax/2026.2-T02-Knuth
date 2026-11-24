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

  async findById(paradaId) {
    const query = `
      SELECT id, codigo, nome, latitude, longitude
      FROM paradas
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [paradaId]);
    return rows[0] || null;
  }

  // RF11 - Próximas partidas programadas em uma parada em ordem cronológica
  async findProximasPartidas(paradaId, tipoDia, horarioReferencia, limite = 30) {
    const query = `
      SELECT
        linha_id,
        linha_codigo,
        linha_nome,
        linha_cor,
        sentido,
        destino,
        horario_partida
      FROM (
        SELECT DISTINCT ON (TO_CHAR(hp.partida::time, 'HH24:MI'), l.id, v.sentido)
          l.id AS linha_id,
          l.codigo AS linha_codigo,
          l.nome AS linha_nome,
          l.cor AS linha_cor,
          v.sentido,
          v.destino,
          TO_CHAR(hp.partida::time, 'HH24:MI') AS horario_partida
        FROM horarios_paradas hp
        INNER JOIN viagens v ON v.id = hp.viagem_id
        INNER JOIN calendario c ON c.id = v.calendario_id
        INNER JOIN linhas l ON l.id = v.linha_id
        WHERE hp.parada_id = $1
          AND c.tipo_dia = $2
          AND hp.partida IS NOT NULL
          AND hp.partida::time >= $3::time
        ORDER BY TO_CHAR(hp.partida::time, 'HH24:MI') ASC, l.id ASC, v.sentido ASC
      ) partidas_unicas
      ORDER BY horario_partida ASC, linha_codigo ASC
      LIMIT $4;
    `;
    const { rows } = await pool.query(query, [paradaId, tipoDia, horarioReferencia, limite]);
    return rows;
  }
}

module.exports = new ParadasRepository();
