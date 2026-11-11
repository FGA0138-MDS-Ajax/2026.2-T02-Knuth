const pool = require('../config/database');

class TrajetosRepository {
  async buscarParadaPorNome(nome) {
    const query = `SELECT id, nome FROM paradas WHERE nome ILIKE $1 LIMIT 1;`;
    const { rows } = await pool.query(query, [`%${nome}%`]);
    return rows[0] || null;
  }

  async buscarTrajetosPorNome(origem, destino) {
    const query = `
      SELECT 
        v.id AS viagem_id,
        l.codigo AS codigo_linha,
        hpo.partida AS horario_origem,
        hpd.partida AS horario_destino,
        (EXTRACT(EPOCH FROM (hpd.partida::time - hpo.partida::time)) / 60) AS duracao,
        (hpd.sequencia - hpo.sequencia) AS qtd_paradas,
        po.nome AS nome_origem,
        pd.nome AS nome_destino
      FROM viagens v
      INNER JOIN linhas l ON v.linha_id = l.id
      INNER JOIN horarios_paradas hpo ON hpo.viagem_id = v.id
      INNER JOIN paradas po ON hpo.parada_id = po.id
      INNER JOIN horarios_paradas hpd ON hpd.viagem_id = v.id
      INNER JOIN paradas pd ON hpd.parada_id = pd.id
      WHERE po.nome ILIKE $1 
        AND pd.nome ILIKE $2
        AND hpd.sequencia > hpo.sequencia
      LIMIT 10;
    `;
    const { rows } = await pool.query(query, [`%${origem}%`, `%${destino}%`]);
    return rows;
  }
}

module.exports = new TrajetosRepository();