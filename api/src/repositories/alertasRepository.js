const pool = require('../config/database');

class AlertasRepository {
  // RF13 - Retorna todos os alertas vigentes (data_inicio <= agora <= data_fim)
  async findAlertasVigentes() {
    const query = `
      SELECT
        a.id,
        a.tipo,
        a.descricao,
        TO_CHAR(a.data_inicio, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS data_inicio,
        TO_CHAR(a.data_fim,    'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS data_fim,
        COALESCE(
          JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', l.id, 'codigo', l.codigo, 'nome', l.nome))
            FILTER (WHERE l.id IS NOT NULL),
          '[]'
        ) AS linhas_afetadas,
        COALESCE(
          JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', p.id, 'codigo', p.codigo, 'nome', p.nome))
            FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS paradas_afetadas
      FROM alertas a
      LEFT JOIN alertas_linhas  al ON al.alerta_id = a.id
      LEFT JOIN linhas           l  ON l.id         = al.linha_id
      LEFT JOIN alertas_paradas  ap ON ap.alerta_id = a.id
      LEFT JOIN paradas          p  ON p.id         = ap.parada_id
      WHERE NOW() BETWEEN a.data_inicio AND a.data_fim
      GROUP BY a.id
      ORDER BY a.data_inicio DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // RF13 - Retorna um alerta vigente pelo id
  async findAlertaVigenteById(id) {
    const query = `
      SELECT
        a.id,
        a.tipo,
        a.descricao,
        TO_CHAR(a.data_inicio, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS data_inicio,
        TO_CHAR(a.data_fim,    'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS data_fim,
        COALESCE(
          JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', l.id, 'codigo', l.codigo, 'nome', l.nome))
            FILTER (WHERE l.id IS NOT NULL),
          '[]'
        ) AS linhas_afetadas,
        COALESCE(
          JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', p.id, 'codigo', p.codigo, 'nome', p.nome))
            FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS paradas_afetadas
      FROM alertas a
      LEFT JOIN alertas_linhas  al ON al.alerta_id = a.id
      LEFT JOIN linhas           l  ON l.id         = al.linha_id
      LEFT JOIN alertas_paradas  ap ON ap.alerta_id = a.id
      LEFT JOIN paradas          p  ON p.id         = ap.parada_id
      WHERE a.id = $1
        AND NOW() BETWEEN a.data_inicio AND a.data_fim
      GROUP BY a.id;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
}

module.exports = new AlertasRepository();
