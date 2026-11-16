const pool = require('../config/database');

class GerenciarUsuariosRepository {
  async listar(tipo) {
    let query = 'SELECT id, nome, email, tipo, criado_em FROM usuarios';
    const params = [];

    if (tipo) {
      query += ' WHERE tipo = $1';
      params.push(tipo);
    }

    query += ' ORDER BY id;';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  async buscarPorId(id) {
    const query = 'SELECT id, nome, email, tipo FROM usuarios WHERE id = $1;';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async contarAdmins() {
    const query = "SELECT COUNT(*)::int AS total FROM usuarios WHERE tipo = 'ADMIN';";
    const { rows } = await pool.query(query);
    return rows[0].total;
  }

  async atualizar(id, nome, email, senhaHash, tipo) {
    const query = `
      UPDATE usuarios
      SET nome = $2, email = $3, tipo = $5, senha_hash = COALESCE($4, senha_hash)
      WHERE id = $1
      RETURNING id, nome, email, tipo;
    `;
    const { rows } = await pool.query(query, [id, nome, email, senhaHash, tipo]);
    return rows[0];
  }

  async excluir(id) {
    await pool.query('DELETE FROM usuarios WHERE id = $1;', [id]);
  }
}

module.exports = new GerenciarUsuariosRepository();