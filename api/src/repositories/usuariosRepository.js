const pool = require('../config/database');

class UsuariosRepository {
  async criar(nome, email, senhaHash) {
    const query = `
      INSERT INTO usuarios (nome, email, senha_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, nome, email, tipo;
    `;
    const { rows } = await pool.query(query, [nome, email, senhaHash]);
    return rows[0];
  }

  async buscarPorEmail(email) {
    const query = `SELECT * FROM usuarios WHERE email = $1;`;
    const { rows } = await pool.query(query, [email]);
    return rows[0] || null;
  }

  async buscarPorId(id) {
    const query = `SELECT * FROM usuarios WHERE id = $1;`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async atualizarSenha(id, senhaHash) {
    const query = `UPDATE usuarios SET senha_hash = $2 WHERE id = $1;`;
    await pool.query(query, [id, senhaHash]);
  }

  async excluir(id) {
    await pool.query('DELETE FROM usuarios WHERE id = $1;', [id]);
  }
}

module.exports = new UsuariosRepository();
