const pool = require('../config/database');
const {
  sqlNormalizarColuna,
  prepararTermosBusca,
  criarCondicaoToken,
} = require('../utils/normalizacaoBusca');

const COLUNA_NOME_NORM = sqlNormalizarColuna('nome');

function normalizarIds(ids) {
  const lista = Array.isArray(ids) ? ids : [ids];
  return lista
    .filter((id) => id !== undefined && id !== null && String(id).trim() !== '')
    .map((id) => String(id));
}

class TrajetosRepository {
  async buscarParadasPorNome(nome, limite = 15) {
    const { termoNormalizado, tokens, gruposAlternativos } = prepararTermosBusca(nome);
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

    const query = `
      WITH matches AS (
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
        ORDER BY prioridade ASC, LENGTH(nome) ASC, nome ASC
        LIMIT ${limiteParam}
      ),
      vizinhas AS (
        SELECT
          p.id,
          p.nome,
          p.latitude,
          p.longitude,
          100 AS prioridade,
          (6371 * 2 * asin(sqrt(
            LEAST(1, power(sin(radians(p.latitude - m.latitude) / 2), 2) +
            cos(radians(m.latitude)) * cos(radians(p.latitude)) *
            power(sin(radians(p.longitude - m.longitude) / 2), 2))
          ))) AS distancia_km
        FROM matches m
        INNER JOIN paradas p ON p.id <> m.id
        WHERE (SELECT COUNT(*) FROM matches) = 1
          AND m.latitude IS NOT NULL
          AND m.longitude IS NOT NULL
          AND p.latitude IS NOT NULL
          AND p.longitude IS NOT NULL
          AND ABS(p.latitude - m.latitude) <= 0.004
          AND ABS(p.longitude - m.longitude) <= 0.004
      )
      SELECT id, nome, latitude, longitude
      FROM (
        SELECT id, nome, latitude, longitude, prioridade, 0::double precision AS distancia_km
        FROM matches
        UNION ALL
        SELECT id, nome, latitude, longitude, prioridade, distancia_km
        FROM (
          SELECT id, nome, latitude, longitude, prioridade, distancia_km
          FROM vizinhas
          WHERE distancia_km <= 0.35
          ORDER BY distancia_km ASC
          LIMIT 8
        ) v
      ) resultado
      ORDER BY prioridade ASC, distancia_km ASC, LENGTH(nome) ASC;
    `;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  async buscarRotasDiretas(idsOrigem, idsDestino) {
    const origens = normalizarIds(idsOrigem);
    const destinos = normalizarIds(idsDestino);

    if (origens.length === 0 || destinos.length === 0) {
      return [];
    }

    const query = `
      WITH rotas_candidatas AS (
        SELECT
          v.id AS viagem_id,
          l.codigo AS linha_codigo,
          l.cor AS linha_cor,
          hp1.sequencia AS seq_origem,
          hp2.sequencia AS seq_destino,
          hp1.partida AS horario_origem,
          hp2.partida AS horario_destino,
          CASE
            WHEN CAST(hp2.partida AS TIME) >= CAST(hp1.partida AS TIME)
              THEN EXTRACT(EPOCH FROM (CAST(hp2.partida AS TIME) - CAST(hp1.partida AS TIME))) / 60
            ELSE (EXTRACT(EPOCH FROM (CAST(hp2.partida AS TIME) - CAST(hp1.partida AS TIME))) / 60) + 1440
          END AS duracao,
          (hp2.sequencia - hp1.sequencia) AS qtd_paradas,
          po.id AS origem_id,
          po.nome AS nome_origem,
          po.latitude AS lat_origem,
          po.longitude AS lng_origem,
          pd.id AS destino_id,
          pd.nome AS nome_destino,
          pd.latitude AS lat_destino,
          pd.longitude AS lng_destino,
          ROW_NUMBER() OVER (
            PARTITION BY l.codigo
            ORDER BY (hp2.sequencia - hp1.sequencia) ASC, hp1.partida ASC
          ) AS ordem_linha
        FROM horarios_paradas hp1
        INNER JOIN horarios_paradas hp2
          ON hp2.viagem_id = hp1.viagem_id
          AND hp2.parada_id = ANY($2::text[])
          AND hp2.sequencia > hp1.sequencia
        INNER JOIN viagens v ON v.id = hp1.viagem_id
        INNER JOIN linhas l ON l.id = v.linha_id
        INNER JOIN paradas po ON po.id = hp1.parada_id
        INNER JOIN paradas pd ON pd.id = hp2.parada_id
        WHERE hp1.parada_id = ANY($1::text[])
      )
      SELECT
        viagem_id,
        linha_codigo,
        linha_cor,
        seq_origem,
        seq_destino,
        horario_origem,
        horario_destino,
        duracao,
        qtd_paradas,
        origem_id,
        nome_origem,
        lat_origem,
        lng_origem,
        destino_id,
        nome_destino,
        lat_destino,
        lng_destino
      FROM rotas_candidatas
      WHERE ordem_linha <= 2
      ORDER BY duracao ASC, horario_origem ASC
      LIMIT 8;
    `;
    const { rows } = await pool.query(query, [origens, destinos]);
    return rows;
  }

  async buscarRotasComBaldeacao(idsOrigem, idsDestino) {
    const origens = normalizarIds(idsOrigem);
    const destinos = normalizarIds(idsDestino);

    if (origens.length === 0 || destinos.length === 0) {
      return [];
    }

    const query = `
      WITH padroes_origem AS MATERIALIZED (
        SELECT DISTINCT ON (v.linha_id, v.sentido)
          v.id AS viagem_ref,
          v.linha_id,
          v.sentido,
          hp.parada_id AS origem_id,
          hp.sequencia AS seq_origem
        FROM horarios_paradas hp
        INNER JOIN viagens v ON v.id = hp.viagem_id
        WHERE hp.parada_id = ANY($1::text[])
        ORDER BY v.linha_id, v.sentido, hp.sequencia ASC
      ),
      padroes_destino AS MATERIALIZED (
        SELECT DISTINCT ON (v.linha_id, v.sentido)
          v.id AS viagem_ref,
          v.linha_id,
          v.sentido,
          hp.parada_id AS destino_id,
          hp.sequencia AS seq_destino
        FROM horarios_paradas hp
        INNER JOIN viagens v ON v.id = hp.viagem_id
        WHERE hp.parada_id = ANY($2::text[])
        ORDER BY v.linha_id, v.sentido, hp.sequencia DESC
      ),
      leg1_topo AS MATERIALIZED (
        SELECT
          po.linha_id AS linha_1_id,
          po.sentido AS sentido_1,
          po.origem_id,
          hpt.parada_id AS parada_transfer_id,
          (hpt.sequencia - po.seq_origem) AS paradas_leg1
        FROM padroes_origem po
        INNER JOIN horarios_paradas hpt
          ON hpt.viagem_id = po.viagem_ref
          AND hpt.sequencia > po.seq_origem
      ),
      leg2_topo AS MATERIALIZED (
        SELECT
          pd.linha_id AS linha_2_id,
          pd.sentido AS sentido_2,
          pd.destino_id,
          hpt.parada_id AS parada_transfer_id,
          (pd.seq_destino - hpt.sequencia) AS paradas_leg2
        FROM padroes_destino pd
        INNER JOIN horarios_paradas hpt
          ON hpt.viagem_id = pd.viagem_ref
          AND hpt.sequencia < pd.seq_destino
      ),
      melhores_padroes AS (
        SELECT DISTINCT ON (l1.linha_1_id, l2.linha_2_id)
          l1.linha_1_id,
          l1.sentido_1,
          l1.origem_id,
          l1.parada_transfer_id,
          l2.linha_2_id,
          l2.sentido_2,
          l2.destino_id,
          (l1.paradas_leg1 + l2.paradas_leg2) AS total_paradas
        FROM leg1_topo l1
        INNER JOIN leg2_topo l2
          ON l1.parada_transfer_id = l2.parada_transfer_id
          AND l1.linha_1_id <> l2.linha_2_id
        ORDER BY l1.linha_1_id, l2.linha_2_id, (l1.paradas_leg1 + l2.paradas_leg2) ASC
      ),
      top_padroes AS MATERIALIZED (
        SELECT * FROM melhores_padroes
        ORDER BY total_paradas ASC
        LIMIT 12
      ),
      leg1_horarios AS MATERIALIZED (
        SELECT
          v1.id AS viagem_1_id,
          tp.linha_1_id,
          tp.linha_2_id,
          tp.sentido_2,
          tp.origem_id,
          tp.parada_transfer_id,
          tp.origem_id,
          tp.destino_id,
          l1.codigo AS linha_1,
          l1.cor AS linha_1_cor,
          hp_o.sequencia AS seq_origem_1,
          hp_t.sequencia AS seq_transfer_1,
          hp_o.partida AS hora_origem,
          hp_t.partida AS hora_chegada_transfer,
          (hp_t.sequencia - hp_o.sequencia) AS paradas_leg1,
          po.nome AS nome_origem,
          po.latitude AS lat_origem,
          po.longitude AS lng_origem,
          ROW_NUMBER() OVER (
            PARTITION BY tp.linha_1_id, tp.linha_2_id, tp.parada_transfer_id
            ORDER BY hp_o.partida ASC
          ) AS rn
        FROM top_padroes tp
        INNER JOIN viagens v1 ON v1.linha_id = tp.linha_1_id AND v1.sentido = tp.sentido_1
        INNER JOIN linhas l1 ON l1.id = v1.linha_id
        INNER JOIN horarios_paradas hp_o ON hp_o.viagem_id = v1.id AND hp_o.parada_id = tp.origem_id
        INNER JOIN horarios_paradas hp_t
          ON hp_t.viagem_id = v1.id
          AND hp_t.parada_id = tp.parada_transfer_id
          AND hp_t.sequencia > hp_o.sequencia
        INNER JOIN paradas po ON po.id = tp.origem_id
      ),
      candidatas AS (
        SELECT
          l1h.viagem_1_id,
          v2.id AS viagem_2_id,
          l1h.linha_1,
          l1h.linha_1_cor,
          l2.codigo AS linha_2,
          l2.cor AS linha_2_cor,
          l1h.seq_origem_1,
          l1h.seq_transfer_1,
          hp_t2.sequencia AS seq_transfer_2,
          hp_d.sequencia AS seq_destino_2,
          l1h.origem_id,
          l1h.parada_transfer_id AS transfer_id,
          l1h.destino_id,
          pt.nome AS nome_transferencia,
          pt.latitude AS lat_transferencia,
          pt.longitude AS lng_transferencia,
          l1h.hora_origem,
          l1h.hora_chegada_transfer,
          hp_t2.partida AS hora_saida_transfer,
          hp_d.partida AS hora_destino,
          CASE
            WHEN CAST(hp_d.partida AS TIME) >= CAST(l1h.hora_origem AS TIME)
              THEN EXTRACT(EPOCH FROM (CAST(hp_d.partida AS TIME) - CAST(l1h.hora_origem AS TIME))) / 60
            ELSE (EXTRACT(EPOCH FROM (CAST(hp_d.partida AS TIME) - CAST(l1h.hora_origem AS TIME))) / 60) + 1440
          END AS duracao_total,
          l1h.paradas_leg1,
          (hp_d.sequencia - hp_t2.sequencia) AS paradas_leg2,
          l1h.origem_id,
          l1h.nome_origem,
          l1h.lat_origem,
          l1h.lng_origem,
          pd.nome AS nome_destino,
          pd.latitude AS lat_destino,
          pd.longitude AS lng_destino,
          ROW_NUMBER() OVER (
            PARTITION BY l1h.linha_1, l2.codigo
            ORDER BY
              EXTRACT(EPOCH FROM (CAST(hp_t2.partida AS TIME) - CAST(l1h.hora_chegada_transfer AS TIME))) ASC,
              l1h.hora_origem ASC
          ) AS rn_par
        FROM leg1_horarios l1h
        INNER JOIN viagens v2 ON v2.linha_id = l1h.linha_2_id AND v2.sentido = l1h.sentido_2
        INNER JOIN linhas l2 ON l2.id = v2.linha_id
        INNER JOIN horarios_paradas hp_t2
          ON hp_t2.viagem_id = v2.id
          AND hp_t2.parada_id = l1h.parada_transfer_id
        INNER JOIN horarios_paradas hp_d
          ON hp_d.viagem_id = v2.id
          AND hp_d.parada_id = l1h.destino_id
          AND hp_d.sequencia > hp_t2.sequencia
        INNER JOIN paradas pt ON pt.id = l1h.parada_transfer_id
        INNER JOIN paradas pd ON pd.id = l1h.destino_id
        WHERE l1h.rn <= 5
          AND CAST(hp_t2.partida AS TIME) >= CAST(l1h.hora_chegada_transfer AS TIME)
          AND (EXTRACT(EPOCH FROM (CAST(hp_t2.partida AS TIME) - CAST(l1h.hora_chegada_transfer AS TIME))) / 60) <= 60
      )
      SELECT
        viagem_1_id,
        viagem_2_id,
        linha_1,
        linha_1_cor,
        linha_2,
        linha_2_cor,
        seq_origem_1,
        seq_transfer_1,
        seq_transfer_2,
        seq_destino_2,
        origem_id,
        transfer_id,
        destino_id,
        nome_transferencia,
        lat_transferencia,
        lng_transferencia,
        hora_origem,
        hora_chegada_transfer,
        hora_saida_transfer,
        hora_destino,
        duracao_total,
        paradas_leg1,
        paradas_leg2,
        nome_origem,
        lat_origem,
        lng_origem,
        nome_destino,
        lat_destino,
        lng_destino
      FROM candidatas
      WHERE rn_par = 1
      ORDER BY duracao_total ASC, hora_origem ASC
      LIMIT 5;
    `;
    const { rows } = await pool.query(query, [origens, destinos]);
    return rows;
  }

  // RF04 - Busca a sequência ordenada de paradas com coordenadas para desenhar um trecho no mapa
  async buscarParadasTrecho(viagemId, seqInicio, seqFim) {
    if (!viagemId || seqInicio === undefined || seqFim === undefined) {
      return [];
    }
    const query = `
      SELECT
        hp.sequencia,
        p.id AS parada_id,
        p.codigo,
        p.nome,
        p.latitude,
        p.longitude
      FROM horarios_paradas hp
      INNER JOIN paradas p ON p.id = hp.parada_id
      WHERE hp.viagem_id = $1
        AND hp.sequencia >= $2
        AND hp.sequencia <= $3
        AND p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
      ORDER BY hp.sequencia ASC;
    `;
    const { rows } = await pool.query(query, [viagemId, seqInicio, seqFim]);
    return rows;
  }
}

module.exports = new TrajetosRepository();
