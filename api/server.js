const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.get('/api/v1/linhas', async (req, res) => {
  try {
    const { busca } = req.query;

    let query = 'SELECT id, codigo, nome, cor FROM linhas';
    const params = [];

    if (busca) {
      params.push(`%${busca}%`);
      query += ` WHERE codigo ILIKE $1 OR nome ILIKE $1`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar linhas:', err);
    res.status(500).json({ error: 'Erro ao buscar linhas no banco de dados' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});