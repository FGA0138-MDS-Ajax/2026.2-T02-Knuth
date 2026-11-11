const pool = require('../config/database');

class TrajetosRepository {
  async buscarParadasPorNome(nome) {
    const query = `
      SELECT id, nome FROM paradas 
      WHERE nome ILIKE $1 
      LIMIT 3;
    `;
    const { rows } = await pool.query(query, [`%${nome}%`]);
    return rows;
  }

  async buscarRotasDiretas(idOrigem, idDestino) {
    const query = `
      SELECT 
        v.id AS viagem_id,
        l.codigo AS linha_codigo,
        hpo.partida AS horario_origem,
        hpd.partida AS horario_destino,
        (EXTRACT(EPOCH FROM (hpd.partida::time - hpo.partida::time)) / 60) AS duracao,
        (hpd.sequencia - hpo.sequencia) AS qtd_paradas,
        po.nome AS nome_origem,
        pd.nome AS nome_destino
      FROM viagens v
      INNER JOIN linhas l ON v.linha_id = l.id
      INNER JOIN horarios_paradas hpo ON hpo.viagem_id = v.id AND hpo.parada_id = $1
      INNER JOIN horarios_paradas hpd ON hpd.viagem_id = v.id AND hpd.parada_id = $2
      INNER JOIN paradas po ON po.id = hpo.parada_id
      INNER JOIN paradas pd ON pd.id = hpd.parada_id
      WHERE hpd.sequencia > hpo.sequencia
      ORDER BY hpo.partida ASC
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
          hpo.partida AS hora_origem,
          hpo.sequencia AS seq_origem,
          hpt.parada_id AS parada_transfer_id,
          hpt.partida AS hora_chegada_transfer,
          hpt.sequencia AS seq_transfer,
          po.nome AS nome_origem
        FROM horarios_paradas hpo
        INNER JOIN viagens v ON hpo.viagem_id = v.id
        INNER JOIN linhas l ON v.linha_id = l.id
        INNER JOIN horarios_paradas hpt ON hpt.viagem_id = v.id
        INNER JOIN paradas po ON po.id = hpo.parada_id
        WHERE hpo.parada_id = $1 AND hpt.sequencia > hpo.sequencia
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
      )
      SELECT 
        leg1.linha_1,
        leg2.linha_2,
        pt.nome AS nome_transferencia,
        leg1.hora_origem,
        leg1.hora_chegada_transfer,
        leg2.hora_saida_transfer,
        leg2.hora_destino,
        (EXTRACT(EPOCH FROM (leg2.hora_destino::time - leg1.hora_origem::time)) / 60) AS duracao_total,
        (leg1.seq_transfer - leg1.seq_origem) AS paradas_leg1,
        (leg2.seq_destino - leg2.seq_saida_transfer) AS paradas_leg2,
        leg1.nome_origem,
        leg2.nome_destino
      FROM leg1
      INNER JOIN leg2 ON leg1.parada_transfer_id = leg2.parada_transfer_id
      INNER JOIN paradas pt ON pt.id = leg1.parada_transfer_id
      WHERE leg1.linha_1 != leg2.linha_2 
        AND leg2.hora_saida_transfer >= leg1.hora_chegada_transfer
      ORDER BY leg1.hora_origem ASC
      LIMIT 3;
    `;
    const { rows } = await pool.query(query, [idOrigem, idDestino]);
    return rows;
  }
}

module.exports = new TrajetosRepository();