const pool = require('../config/database');

class LinhasRepository {
  async findLinhas(filters = {}) {
    // Suporta tanto o envio de string de busca simples quanto objeto com filtros do RF02
    const { busca, bacia, regiao, tipo } = typeof filters === 'string' ? { busca: filters } : filters;

    let query = 'SELECT id, codigo, nome, cor FROM linhas WHERE 1=1';
    const params = [];

    if (busca) {
      params.push(`%${busca}%`);
      query += ` AND (codigo ILIKE $${params.length} OR nome ILIKE $${params.length})`;
    }

    if (bacia) {
      params.push(bacia);
      query += ` AND bacia = $${params.length}`;
    }

    if (regiao) {
      params.push(`%${regiao}%`);
      query += ` AND regiao_administrativa ILIKE $${params.length}`;
    }

    if (tipo) {
      params.push(tipo);
      query += ` AND tipo_tarifa = $${params.length}`;
    }

    const { rows } = await pool.query(query, params);
    return rows;
  }

  // Alias para garantir compatibilidade caso algum service chame findLinhasWithFilters
  async findLinhasWithFilters(filtros) {
    return this.findLinhas(filtros);
  }

  async findItinerarioByLinhaId(linhaId) {
    const query = `
      SELECT DISTINCT ON (v.sentido, hp.sequencia)
        l.id AS linha_id, l.codigo AS linha_codigo, l.nome AS linha_nome, l.cor AS linha_cor,
        v.sentido, hp.sequencia, p.id AS parada_id, p.codigo AS parada_codigo, p.nome AS parada_nome, 
        p.latitude, p.longitude
      FROM linhas l
      INNER JOIN viagens v ON v.linha_id = l.id
      INNER JOIN horarios_paradas hp ON hp.viagem_id = v.id
      INNER JOIN paradas p ON p.id = hp.parada_id
      WHERE l.id = $1
      ORDER BY v.sentido, hp.sequencia ASC;
    `;
    const { rows } = await pool.query(query, [linhaId]);
    return rows;
  }

  async findHorariosByLinhaId(linhaId) {
    const query = `
      SELECT 
        l.id AS linha_id, l.codigo AS linha_codigo, l.nome AS linha_nome,
        v.sentido, c.tipo_dia, TO_CHAR(hp.partida::time, 'HH24:MI') AS horario_partida
      FROM linhas l
      INNER JOIN viagens v ON v.linha_id = l.id
      INNER JOIN calendario c ON c.id = v.calendario_id
      INNER JOIN horarios_paradas hp ON hp.viagem_id = v.id
      WHERE l.id = $1 AND hp.sequencia = 1
      ORDER BY v.sentido, c.tipo_dia, hp.partida ASC;
    `;
    const { rows } = await pool.query(query, [linhaId]);
    return rows;
  }
}

module.exports = new LinhasRepository();