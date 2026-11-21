const pool = require('../config/database');

class FavoritosRepository {
  async listar(usuarioId) {
    const query = `
      SELECT f.id, f.tipo,
             f.linha_id AS "linhaId", f.parada_id AS "paradaId",
             f.origem, f.destino, f.criado_em AS "criadoEm",
             l.codigo AS "linhaCodigo", l.nome AS "linhaNome", l.cor AS "linhaCor",
             p.codigo AS "paradaCodigo", p.nome AS "paradaNome"
      FROM favoritos f
      LEFT JOIN linhas l ON l.id = f.linha_id
      LEFT JOIN paradas p ON p.id = f.parada_id
      WHERE f.usuario_id = $1
      ORDER BY f.criado_em DESC;
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return rows;
  }

  async adicionar({ usuarioId, tipo, linhaId = null, paradaId = null, origem = null, destino = null }) {
    const query = `
      INSERT INTO favoritos (usuario_id, tipo, linha_id, parada_id, origem, destino)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id, tipo, linha_id AS "linhaId", parada_id AS "paradaId",
                origem, destino, criado_em AS "criadoEm";
    `;
    const { rows } = await pool.query(query, [usuarioId, tipo, linhaId, paradaId, origem, destino]);
    return rows[0] || null;
  }

  async remover(id, usuarioId) {
    const query = `
      DELETE FROM favoritos
      WHERE id = $1 AND usuario_id = $2;
    `;
    const { rowCount } = await pool.query(query, [id, usuarioId]);
    return rowCount > 0;
  }
}

module.exports = new FavoritosRepository();