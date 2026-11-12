const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || '127.0.0.1', 
  database: process.env.DB_NAME || 'rotasdf',
  password: process.env.DB_PASSWORD || 'adminpassword',
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;