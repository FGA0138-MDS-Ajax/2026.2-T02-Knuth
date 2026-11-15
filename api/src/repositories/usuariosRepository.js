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
}

module.exports = new UsuariosRepository();