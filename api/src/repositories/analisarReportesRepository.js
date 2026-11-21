
const pool = require('../config/database');

const CAMPOS_REPORTE = `
  r.id,
  r.tipo,
  r.descricao,
  r.linha_id AS "linhaId",
  r.parada_id AS "paradaId",
  r.usuario_id AS "usuarioId",
  u.nome AS "usuarioNome",
  u.email AS "usuarioEmail",
  r.status,
  r.observacao_admin AS "observacaoAdmin",
  r.criado_em AS "criadoEm",
  r.analisado_em AS "analisadoEm"
`;

// RF24 - Consulta e análise administrativa de reportes de divergência
class AnalisarReportesRepository {
  async listar({ status, tipo } = {}) {
    const condicoes = [];
    const params = [];

    if (status) {
      params.push(status);
      condicoes.push(`r.status = $${params.length}`);
    }

    if (tipo) {
      params.push(tipo);
      condicoes.push(`r.tipo = $${params.length}`);
    }

    const where = condicoes.length > 0
      ? `WHERE ${condicoes.join(' AND ')}`
      : '';

    const query = `
      SELECT ${CAMPOS_REPORTE}
      FROM reportes_divergencia r
      LEFT JOIN usuarios u ON u.id = r.usuario_id
      ${where}
      ORDER BY
        CASE WHEN r.status = 'PENDENTE' THEN 0 ELSE 1 END,
        r.criado_em DESC,
        r.id DESC;
    `;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  async buscarPorId(id) {
    const query = `
      SELECT ${CAMPOS_REPORTE}
      FROM reportes_divergencia r
      LEFT JOIN usuarios u ON u.id = r.usuario_id
      WHERE r.id = $1;
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async atualizarAnalise(id, status, observacaoAdmin) {
    const query = `
      UPDATE reportes_divergencia
      SET
        status = $2,
        observacao_admin = $3,
        analisado_em = CASE
          WHEN $2::VARCHAR = 'PENDENTE' THEN NULL
          ELSE NOW()
        END
      WHERE id = $1
      RETURNING
        id,
        tipo,
        descricao,
        linha_id AS "linhaId",
        parada_id AS "paradaId",
        usuario_id AS "usuarioId",
        status,
        observacao_admin AS "observacaoAdmin",
        criado_em AS "criadoEm",
        analisado_em AS "analisadoEm";
    `;

    const { rows } = await pool.query(query, [
      id,
      status,
      observacaoAdmin
    ]);

    return rows[0] || null;
  }
}

module.exports = new AnalisarReportesRepository();

