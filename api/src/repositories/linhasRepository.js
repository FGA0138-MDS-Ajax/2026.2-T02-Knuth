const pool = require('../config/database');

class LinhasRepository {
  async findLinhas(filters = {}) {
    const { busca } = typeof filters === 'string' ? { busca: filters } : filters;

    let query =
      'SELECT id, codigo, nome, cor, tarifa, faixa_tarifaria, operadora, extensao_km FROM linhas WHERE 1=1';
    const params = [];

    if (busca) {
      params.push(`%${busca}%`);
      query += ` AND (codigo ILIKE $${params.length} OR nome ILIKE $${params.length})`;
    }

    const { rows } = await pool.query(query, params);
    return rows;
  }

  async findItinerarioByLinhaId(linhaId) {
    const query = `
      SELECT DISTINCT ON (v.sentido, hp.sequencia)
        l.id AS linha_id, l.codigo AS linha_codigo, l.nome AS linha_nome, l.cor AS linha_cor,
        l.tarifa AS linha_tarifa, l.faixa_tarifaria AS linha_faixa_tarifaria,
        l.operadora AS linha_operadora, l.extensao_km AS linha_extensao_km,
        v.sentido, hp.sequencia, p.id AS parada_id, p.codigo AS parada_codigo, p.nome AS parada_nome, 
        p.latitude, p.longitude, p.tipo AS parada_tipo, p.estrutura AS parada_estrutura
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
        l.id AS linha_id, l.codigo AS linha_codigo, l.nome AS linha_nome, l.cor AS linha_cor,
        l.tarifa AS linha_tarifa, l.faixa_tarifaria AS linha_faixa_tarifaria,
        l.operadora AS linha_operadora, l.extensao_km AS linha_extensao_km,
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

  // RF23 - Manutenção manual de linhas pelo administrador
  async buscarPorId(id) {
    const { rows } = await pool.query(
      'SELECT id, codigo, nome, cor, tarifa, faixa_tarifaria, operadora, extensao_km FROM linhas WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async criar({ codigo, nome, cor, tarifa, faixaTarifaria, operadora, extensaoKm }) {
    const { rows } = await pool.query(
      `INSERT INTO linhas (id, codigo, nome, cor, tarifa, faixa_tarifaria, operadora, extensao_km)
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7)
       RETURNING id, codigo, nome, cor, tarifa, faixa_tarifaria, operadora, extensao_km`,
      [codigo, nome, cor, tarifa, faixaTarifaria, operadora, extensaoKm]
    );
    return rows[0];
  }

  async atualizar(id, { nome, cor, tarifa, faixaTarifaria, operadora, extensaoKm }) {
    const { rows } = await pool.query(
      `UPDATE linhas
       SET nome = $2, cor = $3, tarifa = $4, faixa_tarifaria = $5, operadora = $6, extensao_km = $7
       WHERE id = $1
       RETURNING id, codigo, nome, cor, tarifa, faixa_tarifaria, operadora, extensao_km`,
      [id, nome, cor, tarifa, faixaTarifaria, operadora, extensaoKm]
    );
    return rows[0];
  }

  // Viagens, horários e favoritos da linha são apagados em cascata (ON DELETE CASCADE)
  async excluir(id) {
    await pool.query('DELETE FROM linhas WHERE id = $1', [id]);
  }
}

module.exports = new LinhasRepository();