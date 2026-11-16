const pool = require('../config/database');

class AdminRepository {
  async criar(nome, email, senhaHash) {
    const query = `
      INSERT INTO usuarios (nome, email, senha_hash, tipo)
      VALUES ($1, $2, $3, 'ADMIN')
      RETURNING id, nome, email, tipo;
    `;
    const { rows } = await pool.query(query, [nome, email, senhaHash]);
    return rows[0];
  }
}

module.exports = new AdminRepository();