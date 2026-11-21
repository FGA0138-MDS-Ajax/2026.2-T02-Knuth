const pool = require('../config/database');

const SELECT_ALERTAS_BASE = `
      SELECT
        a.id,
        a.tipo,
        a.titulo,
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
`;

const CONDICAO_VIGENTE = `
      NOW() BETWEEN a.data_inicio AND a.data_fim
        AND (a.encerrado_em IS NULL OR a.encerrado_em > NOW())
`;

class AlertasRepository {
  // RF13 - Retorna todos os alertas vigentes (data_inicio <= agora <= data_fim e não encerrado)
  async findAlertasVigentes() {
    const query = `
      ${SELECT_ALERTAS_BASE}
      WHERE ${CONDICAO_VIGENTE}
      GROUP BY a.id
      ORDER BY a.data_inicio DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // RF13 - Retorna um alerta vigente pelo id
  async findAlertaVigenteById(id) {
    const query = `
      ${SELECT_ALERTAS_BASE}
      WHERE a.id = $1
        AND ${CONDICAO_VIGENTE}
      GROUP BY a.id;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  // RF14 - Retorna alertas vigentes que afetam qualquer uma das linhas ou paradas informadas
  async findAlertasVigentesPorItens(linhasIds = [], paradasIds = []) {
    if ((!linhasIds || linhasIds.length === 0) && (!paradasIds || paradasIds.length === 0)) {
      return [];
    }

    const query = `
      ${SELECT_ALERTAS_BASE}
      WHERE ${CONDICAO_VIGENTE}
        AND (
          EXISTS (
            SELECT 1 FROM alertas_linhas al2
            WHERE al2.alerta_id = a.id AND al2.linha_id = ANY($1::varchar[])
          )
          OR EXISTS (
            SELECT 1 FROM alertas_paradas ap2
            WHERE ap2.alerta_id = a.id AND ap2.parada_id = ANY($2::varchar[])
          )
        )
      GROUP BY a.id
      ORDER BY a.data_inicio DESC;
    `;
    const { rows } = await pool.query(query, [linhasIds || [], paradasIds || []]);
    return rows;
  }
}

module.exports = new AlertasRepository();
