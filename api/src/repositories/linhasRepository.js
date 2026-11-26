const pool = require('../config/database');

// RF23 - O destino da viagem é o nome da última parada do itinerário (como no importador)
const atualizarDestinos = async (client, linhaId, sentido) => {
  await client.query(
    `UPDATE viagens v
     SET destino = p.nome
     FROM horarios_paradas hp
     INNER JOIN paradas p ON p.id = hp.parada_id
     WHERE hp.viagem_id = v.id
       AND v.linha_id = $1 AND v.sentido = $2
       AND hp.sequencia = (SELECT MAX(ult.sequencia) FROM horarios_paradas ult WHERE ult.viagem_id = v.id)`,
    [linhaId, sentido]
  );
};

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

  // RF23 - Partidas da linha: cada viagem parte no horário da parada de sequência 1
  async listarPartidas(linhaId, sentido, tipoDia) {
    const { rows } = await pool.query(
      `SELECT v.id AS viagem_id, TO_CHAR(hp.partida, 'HH24:MI') AS horario
       FROM viagens v
       INNER JOIN calendario c ON c.id = v.calendario_id
       INNER JOIN horarios_paradas hp ON hp.viagem_id = v.id AND hp.sequencia = 1
       WHERE v.linha_id = $1 AND v.sentido = $2 AND c.tipo_dia = $3
       ORDER BY hp.partida ASC`,
      [linhaId, sentido, tipoDia]
    );
    return rows;
  }

  async buscarPartida(linhaId, viagemId) {
    const { rows } = await pool.query(
      `SELECT v.id AS viagem_id, v.sentido, c.tipo_dia, TO_CHAR(hp.partida, 'HH24:MI') AS horario
       FROM viagens v
       INNER JOIN calendario c ON c.id = v.calendario_id
       INNER JOIN horarios_paradas hp ON hp.viagem_id = v.id AND hp.sequencia = 1
       WHERE v.id = $1 AND v.linha_id = $2`,
      [viagemId, linhaId]
    );
    return rows[0] || null;
  }

  // Viagem do mesmo sentido e tipo de dia cuja partida é a mais próxima do horário informado
  async buscarPartidaMaisProxima(linhaId, sentido, tipoDia, horario) {
    const { rows } = await pool.query(
      `SELECT v.id AS viagem_id, TO_CHAR(hp.partida, 'HH24:MI') AS horario
       FROM viagens v
       INNER JOIN calendario c ON c.id = v.calendario_id
       INNER JOIN horarios_paradas hp ON hp.viagem_id = v.id AND hp.sequencia = 1
       WHERE v.linha_id = $1 AND v.sentido = $2 AND c.tipo_dia = $3
       ORDER BY ABS(EXTRACT(EPOCH FROM (hp.partida - $4::time))) ASC
       LIMIT 1`,
      [linhaId, sentido, tipoDia, horario]
    );
    return rows[0] || null;
  }

  // Copia a viagem modelo e todos os seus horários, deslocados para a nova partida
  async criarPartida(modeloId, horario) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO viagens (id, linha_id, calendario_id, sentido, destino)
         SELECT 'MANUAL_' || gen_random_uuid(), linha_id, calendario_id, sentido, destino
         FROM viagens
         WHERE id = $1
         RETURNING id`,
        [modeloId]
      );
      const viagemId = rows[0].id;
      await client.query(
        `INSERT INTO horarios_paradas (viagem_id, parada_id, sequencia, partida, chegada)
         SELECT $1, hp.parada_id, hp.sequencia,
                hp.partida + ($3::time - inicio.partida),
                hp.chegada + ($3::time - inicio.partida)
         FROM horarios_paradas hp
         INNER JOIN horarios_paradas inicio ON inicio.viagem_id = hp.viagem_id AND inicio.sequencia = 1
         WHERE hp.viagem_id = $2`,
        [viagemId, modeloId, horario]
      );
      await client.query('COMMIT');
      return viagemId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Desloca todos os horários da viagem para que a parada de sequência 1 parta no novo horário
  async deslocarPartida(viagemId, horario) {
    await pool.query(
      `UPDATE horarios_paradas hp
       SET partida = hp.partida + ($2::time - inicio.partida),
           chegada = hp.chegada + ($2::time - inicio.partida)
       FROM horarios_paradas inicio
       WHERE hp.viagem_id = $1 AND inicio.viagem_id = $1 AND inicio.sequencia = 1`,
      [viagemId, horario]
    );
  }

  // Os horários da viagem são apagados em cascata (ON DELETE CASCADE)
  async excluirPartida(viagemId) {
    await pool.query('DELETE FROM viagens WHERE id = $1', [viagemId]);
  }

  // RF23 - Itinerário: para cada viagem do sentido, o horário na sequência informada e na seguinte,
  // o primeiro e o último horários e o total de paradas
  async listarViagensDoSentido(linhaId, sentido, sequencia) {
    const { rows } = await pool.query(
      `SELECT v.id AS viagem_id,
              atual.partida AS horario_na_sequencia,
              seguinte.partida AS horario_na_seguinte,
              extremos.primeira, extremos.ultima, extremos.total
       FROM viagens v
       LEFT JOIN horarios_paradas atual ON atual.viagem_id = v.id AND atual.sequencia = $3
       LEFT JOIN horarios_paradas seguinte ON seguinte.viagem_id = v.id AND seguinte.sequencia = $3 + 1
       CROSS JOIN LATERAL (
         SELECT (ARRAY_AGG(hp.partida ORDER BY hp.sequencia ASC))[1] AS primeira,
                (ARRAY_AGG(hp.partida ORDER BY hp.sequencia DESC))[1] AS ultima,
                COUNT(*) AS total
         FROM horarios_paradas hp
         WHERE hp.viagem_id = v.id
       ) extremos
       WHERE v.linha_id = $1 AND v.sentido = $2
       ORDER BY v.id`,
      [linhaId, sentido, sequencia]
    );
    return rows;
  }

  async paradaEstaNoItinerario(linhaId, sentido, paradaId) {
    const { rows } = await pool.query(
      `SELECT 1
       FROM horarios_paradas hp
       INNER JOIN viagens v ON v.id = hp.viagem_id
       WHERE v.linha_id = $1 AND v.sentido = $2 AND hp.parada_id = $3
       LIMIT 1`,
      [linhaId, sentido, paradaId]
    );
    return rows.length > 0;
  }

  // Abre a posição depois da sequência informada em todas as viagens do sentido e grava a parada nova
  // com o horário calculado para cada viagem (horarios: [{ viagemId, horario }])
  async incluirParadaNoItinerario(linhaId, sentido, depoisDaSequencia, paradaId, horarios) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE horarios_paradas hp
         SET sequencia = hp.sequencia + 1
         FROM viagens v
         WHERE v.id = hp.viagem_id AND v.linha_id = $1 AND v.sentido = $2 AND hp.sequencia > $3`,
        [linhaId, sentido, depoisDaSequencia]
      );
      // Uma única inserção para todas as viagens do sentido
      await client.query(
        `INSERT INTO horarios_paradas (viagem_id, parada_id, sequencia, partida, chegada)
         SELECT nova.viagem_id, $1, $2, nova.horario, nova.horario
         FROM UNNEST($3::varchar[], $4::time[]) AS nova(viagem_id, horario)`,
        [paradaId, depoisDaSequencia + 1, horarios.map((h) => h.viagemId), horarios.map((h) => h.horario)]
      );
      await atualizarDestinos(client, linhaId, sentido);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Tira a parada da sequência informada em todas as viagens do sentido; os outros horários não mudam
  async removerParadaDoItinerario(linhaId, sentido, sequencia) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `DELETE FROM horarios_paradas hp
         USING viagens v
         WHERE v.id = hp.viagem_id AND v.linha_id = $1 AND v.sentido = $2 AND hp.sequencia = $3`,
        [linhaId, sentido, sequencia]
      );
      await client.query(
        `UPDATE horarios_paradas hp
         SET sequencia = hp.sequencia - 1
         FROM viagens v
         WHERE v.id = hp.viagem_id AND v.linha_id = $1 AND v.sentido = $2 AND hp.sequencia > $3`,
        [linhaId, sentido, sequencia]
      );
      await atualizarDestinos(client, linhaId, sentido);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new LinhasRepository();