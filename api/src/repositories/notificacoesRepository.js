const pool = require('../config/database');

const criarParaFavoritosAfetados = async ({ alertaId, titulo, resumo, linhas, paradas }) => {
  if (linhas.length === 0 && paradas.length === 0) {
    return [];
  }

  const resultado = await pool.query(
    `WITH inseridas AS (
       INSERT INTO notificacoes (usuario_id, alerta_id, item_tipo, item_id, titulo, resumo)
       SELECT f.usuario_id, $1::int, 'LINHA'::varchar, f.linha_id, $2::varchar, $3::text
       FROM favoritos f
       WHERE f.tipo = 'LINHA' AND f.linha_id = ANY($4::varchar[])
       UNION
       SELECT f.usuario_id, $1::int, 'PARADA'::varchar, f.parada_id, $2::varchar, $3::text
       FROM favoritos f
       WHERE f.tipo = 'PARADA' AND f.parada_id = ANY($5::varchar[])
       ON CONFLICT DO NOTHING
       RETURNING usuario_id, item_tipo, item_id
     )
     SELECT i.usuario_id, i.item_tipo, i.item_id, u.nome, u.email
     FROM inseridas i
     JOIN usuarios u ON u.id = i.usuario_id`,
    [alertaId, titulo, resumo, linhas, paradas]
  );

  return resultado.rows;
};


const listarPorUsuario = async (usuarioId) => {
  const resultado = await pool.query(
    `SELECT id, alerta_id, item_tipo, item_id, titulo, resumo, lida, criado_em
     FROM notificacoes
     WHERE usuario_id = $1
     ORDER BY criado_em DESC, id DESC`,
    [usuarioId]
  );

  return resultado.rows;
};


const marcarComoLida = async (id, usuarioId) => {
  const resultado = await pool.query(
    `UPDATE notificacoes
     SET lida = TRUE
     WHERE id = $1 AND usuario_id = $2
     RETURNING id, alerta_id, item_tipo, item_id, titulo, resumo, lida, criado_em`,
    [id, usuarioId]
  );

  return resultado.rows[0] || null;
};


const contarNaoLidas = async (usuarioId) => {
  const resultado = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM notificacoes
     WHERE usuario_id = $1 AND lida = FALSE`,
    [usuarioId]
  );

  return resultado.rows[0].total;
};

module.exports = {
  criarParaFavoritosAfetados,
  listarPorUsuario,
  marcarComoLida,
  contarNaoLidas
};
