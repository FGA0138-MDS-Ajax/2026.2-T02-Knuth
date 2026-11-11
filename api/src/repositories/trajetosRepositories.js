const pool = require('../config/database');

class TrajetosRepository {
  async buscarParadaPorNome(nome) {
    const query = `SELECT id, nome FROM paradas WHERE nome ILIKE $1 LIMIT 1;`;
    const { rows } = await pool.query(query, [`%${nome}%`]);
    return rows[0] || null;
  }

  async buscarViagensDiretas(idOrigem, idDestino) {
    const query = `
      SELECT 
        v.id AS viagem_id,
        l.codigo AS codigo_linha,
        hpo.partida AS horario_origem,
        hpd.partida AS horario_destino,
        (EXTRACT(EPOCH FROM (hpd.partida::time - hpo.partida::time)) / 60) AS duracao,
        (hpd.sequencia - hpo.sequencia) AS qtd_paradas
      FROM viagens v
      INNER JOIN linhas l ON v.linha_id = l.id
      INNER JOIN horarios_paradas hpo ON hpo.viagem_id = v.id AND hpo.parada_id = $1
      INNER JOIN horarios_paradas hpd ON hpd.viagem_id = v.id AND hpd.parada_id = $2
      WHERE hpd.sequencia > hpo.sequencia
      LIMIT 5;
    `;
    const { rows } = await pool.query(query, [idOrigem, idDestino]);
    return rows;
  }
}

module.exports = new TrajetosRepository();