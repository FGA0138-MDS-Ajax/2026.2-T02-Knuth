const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.DB_USER || 'admin',
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME || 'rotasdf',
      password: process.env.DB_PASSWORD || 'adminpassword',
      port: process.env.DB_PORT || 5432,
    });

module.exports = pool;