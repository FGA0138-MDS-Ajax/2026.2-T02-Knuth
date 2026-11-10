const pool = require('../config/database');

class LinhasRepository {
  async findLinhas(busca) {
    let query = 'SELECT id, codigo, nome, cor FROM linhas';
    const params = [];

    if (busca) {
      params.push(`%${busca}%`);
      query += ' WHERE codigo ILIKE $1 OR nome ILIKE $1';
    }
    const { rows } = await pool.query(query, params);
    return rows;
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