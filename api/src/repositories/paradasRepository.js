const pool = require('../config/database');

class ParadasRepository {
  async findNearestParada(lat, lng) {
    const query = `
      SELECT id, nome, latitude, longitude,
      (6371 * acos(
        cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + 
        sin(radians($1)) * sin(radians(latitude))
      )) AS distancia
      FROM paradas
      ORDER BY distancia ASC
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [lat, lng]);
    return rows[0] || null;
  }
}

module.exports = new ParadasRepository();