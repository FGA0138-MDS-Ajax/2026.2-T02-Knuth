const pool = require('../config/database');

class TrajetosRepository {
  async buscarParadasPorNome(nome) {
    const query = `SELECT id, nome, latitude, longitude FROM paradas WHERE nome ILIKE $1 LIMIT 3;`;
    const { rows } = await pool.query(query, [`%${nome}%`]);
    return rows;
  }

  async buscarConexoes(paradaIds, horarioMinimo, destinoLat, destinoLng) {
    if (!paradaIds || paradaIds.length === 0) return [];

    const query = `
      SELECT DISTINCT ON (hp2.parada_id)
        hp1.parada_id AS origem_id,
        hp2.parada_id AS destino_id,
        p2.nome AS destino_nome,
        l.codigo AS linha_codigo,
        hp1.partida AS horario_saida,
        hp2.partida AS horario_chegada,
        (hp2.sequencia - hp1.sequencia) AS qtd_paradas,
        (EXTRACT(EPOCH FROM (hp2.partida::time - hp1.partida::time)) / 60) AS duracao,
        (6371 * 2 * asin(sqrt(
          power(sin(radians(p2.latitude - $3) / 2), 2) + 
          cos(radians($3)) * cos(radians(p2.latitude)) * power(sin(radians(p2.longitude - $4) / 2), 2)
        ))) AS dist_destino
      FROM horarios_paradas hp1
      INNER JOIN viagens v ON hp1.viagem_id = v.id
      INNER JOIN linhas l ON v.linha_id = l.id
      INNER JOIN horarios_paradas hp2 ON hp2.viagem_id = hp1.viagem_id
      INNER JOIN paradas p2 ON p2.id = hp2.parada_id
      WHERE hp1.parada_id = ANY($1::varchar[])
        AND hp2.sequencia > hp1.sequencia
        AND ($2::time IS NULL OR hp1.partida >= $2::time)
        AND (EXTRACT(EPOCH FROM (hp2.partida::time - hp1.partida::time)) / 60) > 0
      ORDER BY hp2.parada_id, dist_destino ASC
      LIMIT 50;
    `;
    const { rows } = await pool.query(query, [paradaIds, horarioMinimo, destinoLat, destinoLng]);
    return rows;
  }
}

module.exports = new TrajetosRepository();