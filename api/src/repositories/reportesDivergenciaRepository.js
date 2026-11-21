const pool = require('../config/database');

class ReportesDivergenciaRepository {
  async criar({ tipo, descricao, linhaId = null, paradaId = null, usuarioId = null }) {
    const query = `
      INSERT INTO reportes_divergencia (tipo, descricao, linha_id, parada_id, usuario_id, status, criado_em)
      VALUES ($1, $2, $3, $4, $5, 'PENDENTE', NOW())
      RETURNING
        id,
        tipo,
        descricao,
        linha_id AS "linhaId",
        parada_id AS "paradaId",
        usuario_id AS "usuarioId",
        status,
        criado_em AS "criadoEm";
    `;
    const values = [tipo, descricao, linhaId, paradaId, usuarioId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

module.exports = new ReportesDivergenciaRepository();