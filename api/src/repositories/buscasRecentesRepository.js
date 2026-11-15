const pool = require('../config/database');

class BuscasRecentesRepository {
  async salvarBusca(origem, destino, usuarioId = null) {
    const query = `
      INSERT INTO buscas_recentes (origem, destino, usuario_id, realizada_em)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, origem, destino, usuario_id, realizada_em AS "realizadaEm";
    `;
    const values = [origem, destino, usuarioId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async listarBuscasRecentes(usuarioId = null, limite = 5) {
    const query = `
      SELECT id, origem, destino, usuario_id, realizada_em AS "realizadaEm"
      FROM buscas_recentes
      WHERE ($1::uuid IS NULL OR usuario_id = $1)
      ORDER BY realizada_em DESC
      LIMIT $2;
    `;
    const values = [usuarioId, limite];
    const { rows } = await pool.query(query, values);
    return rows;
  }
}

module.exports = new BuscasRecentesRepository();