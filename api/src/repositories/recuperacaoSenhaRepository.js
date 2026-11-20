const pool = require('../config/database');

// RF16 - Códigos temporários de recuperação de senha
class RecuperacaoSenhaRepository {
  async invalidarPendentes(usuarioId) {
    const query = `
      UPDATE recuperacoes_senha
      SET usado_em = NOW()
      WHERE usuario_id = $1 AND usado_em IS NULL;
    `;
    await pool.query(query, [usuarioId]);
  }

  async criar(usuarioId, codigoHash, expiraEm) {
    const query = `
      INSERT INTO recuperacoes_senha (usuario_id, codigo_hash, expira_em)
      VALUES ($1, $2, $3)
      RETURNING id, usuario_id, expira_em;
    `;
    const { rows } = await pool.query(query, [usuarioId, codigoHash, expiraEm]);
    return rows[0];
  }

  async buscarAtiva(usuarioId) {
    const query = `
      SELECT id, usuario_id, codigo_hash, expira_em, tentativas
      FROM recuperacoes_senha
      WHERE usuario_id = $1 AND usado_em IS NULL AND expira_em > NOW()
      ORDER BY criado_em DESC, id DESC
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return rows[0] || null;
  }

  async registrarTentativa(id) {
    const query = `
      UPDATE recuperacoes_senha
      SET tentativas = tentativas + 1
      WHERE id = $1
      RETURNING tentativas;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] ? rows[0].tentativas : 0;
  }

  async marcarUsada(id) {
    await pool.query('UPDATE recuperacoes_senha SET usado_em = NOW() WHERE id = $1;', [id]);
  }
}

module.exports = new RecuperacaoSenhaRepository();
