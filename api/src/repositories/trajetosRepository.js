const pool = require('../config/database');

class TrajetosRepository {
  async buscarParadasPorNome(nome) {
    const query = `SELECT id, nome, latitude, longitude FROM paradas WHERE nome ILIKE $1 LIMIT 1;`;
    const { rows } = await pool.query(query, [`%${nome}%`]);
    return rows;
  }

  async buscarRotasDiretas(idOrigem, idDestino) {
    const query = `
      SELECT 
        v.id AS viagem_id,
        l.codigo AS linha_codigo,
        hp1.partida AS horario_origem,
        hp2.partida AS horario_destino,
        (EXTRACT(EPOCH FROM (CAST(hp2.partida AS TIME) - CAST(hp1.partida AS TIME))) / 60) AS duracao,
        (hp2.sequencia - hp1.sequencia) AS qtd_paradas,
        po.nome AS nome_origem,
        pd.nome AS nome_destino
      FROM viagens v
      INNER JOIN linhas l ON v.linha_id = l.id
      INNER JOIN horarios_paradas hp1 ON hp1.viagem_id = v.id AND hp1.parada_id = $1
      INNER JOIN horarios_paradas hp2 ON hp2.viagem_id = v.id AND hp2.parada_id = $2
      INNER JOIN paradas po ON po.id = hp1.parada_id
      INNER JOIN paradas pd ON pd.id = hp2.parada_id
      WHERE hp2.sequencia > hp1.sequencia
      ORDER BY hp1.partida ASC
      LIMIT 5;
    `;
    const { rows } = await pool.query(query, [idOrigem, idDestino]);
    return rows;
  }

  async buscarRotasComBaldeacao(idOrigem, idDestino) {
    const query = `
      WITH leg1 AS (
        SELECT 
          v.id AS viagem_1_id,
          l.codigo AS linha_1,
          hp1.partida AS hora_origem,
          hp1.sequencia AS seq_origem,
          hpt.parada_id AS parada_transfer_id,
          hpt.partida AS hora_chegada_transfer,
          hpt.sequencia AS seq_transfer,
          po.nome AS nome_origem
        FROM horarios_paradas hp1
        INNER JOIN viagens v ON hp1.viagem_id = v.id
        INNER JOIN linhas l ON v.linha_id = l.id
        INNER JOIN horarios_paradas hpt ON hpt.viagem_id = v.id
        INNER JOIN paradas po ON po.id = hp1.parada_id
        WHERE hp1.parada_id = $1 AND hpt.sequencia > hp1.sequencia
        LIMIT 50
      ),
      leg2 AS (
        SELECT
          v.id AS viagem_2_id,
          l.codigo AS linha_2,
          hpt.parada_id AS parada_transfer_id,
          hpt.partida AS hora_saida_transfer,
          hpt.sequencia AS seq_saida_transfer,
          hpd.partida AS hora_destino,
          hpd.sequencia AS seq_destino,
          pd.nome AS nome_destino
        FROM horarios_paradas hpd
        INNER JOIN viagens v ON hpd.viagem_id = v.id
        INNER JOIN linhas l ON v.linha_id = l.id
        INNER JOIN horarios_paradas hpt ON hpt.viagem_id = v.id
        INNER JOIN paradas pd ON pd.id = hpd.parada_id
        WHERE hpd.parada_id = $2 AND hpd.sequencia > hpt.sequencia
        LIMIT 100
      )
      SELECT 
        leg1.linha_1,
        leg2.linha_2,
        pt.nome AS nome_transferencia,
        leg1.hora_origem,
        leg1.hora_chegada_transfer,
        leg2.hora_saida_transfer,
        leg2.hora_destino,
        (EXTRACT(EPOCH FROM (CAST(leg2.hora_destino AS TIME) - CAST(leg1.hora_origem AS TIME))) / 60) AS duracao_total,
        (leg1.seq_transfer - leg1.seq_origem) AS paradas_leg1,
        (leg2.seq_destino - leg2.seq_saida_transfer) AS paradas_leg2,
        leg1.nome_origem,
        leg2.nome_destino
      FROM leg1
      INNER JOIN leg2 ON leg1.parada_transfer_id = leg2.parada_transfer_id
      INNER JOIN paradas pt ON pt.id = leg1.parada_transfer_id
      WHERE leg1.linha_1 != leg2.linha_2 
        AND CAST(leg2.hora_saida_transfer AS TIME) >= CAST(leg1.hora_chegada_transfer AS TIME)
      ORDER BY leg1.hora_origem ASC
      LIMIT 5;
    `;
    const { rows } = await pool.query(query, [idOrigem, idDestino]);
    return rows;
  }
}

module.exports = new TrajetosRepository();