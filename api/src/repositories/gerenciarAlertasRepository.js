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
      ) AS linhas,
      COALESCE(
        JSON_AGG(DISTINCT al.linha_id) FILTER (WHERE al.linha_id IS NOT NULL),
        '[]'
      ) AS linhas_ids,
      COALESCE(
        JSONB_AGG(DISTINCT jsonb_build_object('id', p.id, 'nome', p.nome)) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS paradas
    FROM alertas a
    LEFT JOIN alertas_linhas al ON al.alerta_id = a.id
    LEFT JOIN linhas l ON l.id = al.linha_id
    LEFT JOIN alertas_paradas ap ON ap.alerta_id = a.id
    LEFT JOIN paradas p ON p.id = ap.parada_id
    GROUP BY a.id
    ORDER BY a.data_inicio DESC
  `);
  return rows;
};

const buscarPorId = async (id) => {
  const { rows } = await pool.query('SELECT id, encerrado_em, data_fim FROM alertas WHERE id = $1', [id]);
  return rows[0] || null;
};

const gravarItens = async (client, alertaId, linhas, paradas) => {
  for (const linhaId of linhas) {
    await client.query(
      'INSERT INTO alertas_linhas (alerta_id, linha_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [alertaId, linhaId]
    );
  }
  for (const paradaId of paradas) {
    await client.query(
      'INSERT INTO alertas_paradas (alerta_id, parada_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [alertaId, paradaId]
    );
  }
};

const criar = async ({ tipo, titulo, descricao, dataInicio, dataFim, linhas, paradas }) => {
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
    await gravarItens(client, alerta.id, linhas, paradas);
    await client.query('COMMIT');
    return { ...alerta, linhas, paradas };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const atualizar = async (id, { tipo, titulo, descricao, dataInicio, dataFim, linhas, paradas }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE alertas
       SET tipo = $2, titulo = $3, descricao = $4, data_inicio = $5, data_fim = $6
       WHERE id = $1
       RETURNING id, tipo, titulo, descricao, data_inicio, data_fim`,
      [id, tipo, titulo, descricao, dataInicio, dataFim]
    );
    await client.query('DELETE FROM alertas_linhas WHERE alerta_id = $1', [id]);
    await client.query('DELETE FROM alertas_paradas WHERE alerta_id = $1', [id]);
    await gravarItens(client, id, linhas, paradas);
    await client.query('COMMIT');
    return { ...rows[0], linhas, paradas };
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

const buscarParadas = async (busca) => {
  const { rows } = await pool.query(
    `SELECT id, codigo, nome
     FROM paradas
     WHERE nome ILIKE $1 OR codigo ILIKE $1
     ORDER BY nome
     LIMIT 10`,
    [`%${busca}%`]
  );
  return rows;
};

module.exports = { listar, buscarPorId, criar, atualizar, encerrar, excluir, buscarParadas };