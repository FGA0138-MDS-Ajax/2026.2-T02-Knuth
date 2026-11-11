const pool = require('../config/database');

class ParadasRepository {
  async findNearestParada(lat, lng) {
    const query = `
      SELECT id, nome, latitude, longitude,
      (6371 * 2 * asin(sqrt(
        power(sin(radians(latitude - $1) / 2), 2) + 
        cos(radians($1)) * cos(radians(latitude)) * power(sin(radians(longitude - $2) / 2), 2)
      ))) AS distancia
      FROM paradas
      ORDER BY distancia ASC
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [lat, lng]);
    return rows[0] || null;
  }
}

module.exports = new ParadasRepository();