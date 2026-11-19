const pool = require('../config/database');

const listar = async () => {
  const { rows } = await pool.query(`
    SELECT
      a.id,
      a.tipo,
      a.titulo,
      a.descricao,
      a.data_inicio,
      a.data_fim,
      a.encerrado_em,
      COALESCE(
        JSON_AGG(DISTINCT l.codigo) FILTER (WHERE l.codigo IS NOT NULL),
        '[]'
      ) AS linhas
    FROM alertas a
    LEFT JOIN alertas_linhas al ON al.alerta_id = a.id
    LEFT JOIN linhas l ON l.id = al.linha_id
    GROUP BY a.id
    ORDER BY a.data_inicio DESC
  `);
  return rows;
};

const buscarPorId = async (id) => {
  const { rows } = await pool.query('SELECT id, encerrado_em, data_fim FROM alertas WHERE id = $1', [id]);
  return rows[0] || null;
};

const criar = async ({ tipo, titulo, descricao, dataInicio, dataFim, linhas }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO alertas (tipo, titulo, descricao, data_inicio, data_fim)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tipo, titulo, descricao, data_inicio, data_fim`,
      [tipo, titulo, descricao, dataInicio, dataFim]
    );
    const alerta = rows[0];
    for (const linhaId of linhas) {
      await client.query(
        'INSERT INTO alertas_linhas (alerta_id, linha_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [alerta.id, linhaId]
      );
    }
    await client.query('COMMIT');
    return { ...alerta, linhas };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const encerrar = async (id) => {
  const { rows } = await pool.query(
    `UPDATE alertas
     SET encerrado_em = NOW(), data_fim = LEAST(data_fim, NOW())
     WHERE id = $1
     RETURNING id, encerrado_em`,
    [id]
  );
  return rows[0];
};

const excluir = async (id) => {
  await pool.query('DELETE FROM alertas WHERE id = $1', [id]);
};

module.exports = { listar, buscarPorId, criar, encerrar, excluir };