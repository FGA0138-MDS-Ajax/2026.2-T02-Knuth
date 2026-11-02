const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuração da conexão com o PostgreSQL usando as variáveis do .env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Rota de teste inicial
app.get('/', (req, res) => {
  res.json({ message: 'API do RotasDF (RF07) a funcionar com sucesso!' });
});

// Rota do RF07: Consulta de Linhas com suporte a filtros por código ou nome
app.get('/api/linhas', async (req, res) => {
  try {
    const { codigo, busca } = req.query;
    
    let query = 'SELECT * FROM linhas WHERE 1=1';
    const params = [];

    // Se o usuário passar o parâmetro ?codigo=...
    if (codigo) {
      params.push(codigo);
      query += ` AND codigo = $${params.length}`;
    }

    // Se o usuário passar o parâmetro ?busca=... (pesquisa por nome)
    if (busca) {
      params.push(`%${busca}%`);
      query += ` AND nome ILIKE $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar linhas:', err);
    res.status(500).json({ error: 'Erro ao buscar linhas no banco de dados' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});