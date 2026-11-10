const pool = require('../config/database');

class LinhasRepository {
  async findLinhas(filters = {}) {
    // Suporta tanto o envio de string de busca simples quanto objeto com filtros do RF02
    const { busca } = typeof filters === 'string' ? { busca: filters } : filters;

    let query = 'SELECT id, codigo, nome, cor FROM linhas WHERE 1=1';
    const params = [];

    if (busca) {
      params.push(`%${busca}%`);
      query += ` AND (codigo ILIKE $${params.length} OR nome ILIKE $${params.length})`;
    }

    const { rows } = await pool.query(query, params);
    return rows;
  }

  // Alias para garantir compatibilidade caso algum service chame findLinhasWithFilters
  async findLinhasWithFilters(filtros) {
    return this.findLinhas(filtros);
  }

  async findItinerarioByLinhaId(linhaId, sentido) {
    const query = `
      SELECT DISTINCT ON (hp.sequencia)
        hp.sequencia,
        p.nome AS parada
      FROM viagens v
      INNER JOIN horarios_paradas hp ON hp.viagem_id = v.id
      INNER JOIN paradas p ON p.id = hp.parada_id
      WHERE v.linha_id = $1 AND v.sentido = $2
      ORDER BY hp.sequencia ASC;
    `;
    const { rows } = await pool.query(query, [linhaId, sentido]);
    return rows;
  }

  async findHorariosByLinhaId(linhaId, sentido) {
    const query = `
      SELECT 
        TO_CHAR(hp.partida::time, 'HH24:MI') AS partida,
        p.nome AS parada
      FROM viagens v
      INNER JOIN horarios_paradas hp ON hp.viagem_id = v.id
      INNER JOIN paradas p ON p.id = hp.parada_id
      WHERE v.linha_id = $1 AND v.sentido = $2 AND hp.sequencia = 1
      ORDER BY hp.partida ASC;
    `;
    const { rows } = await pool.query(query, [linhaId, sentido]);
    return rows;
  }
}

module.exports = new LinhasRepository();