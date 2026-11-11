const express = require('express');
const cors = require('cors');
const linhasRoutes = require('./routes/linhasRoutes');
const trajetosRoutes = require('./routes/trajetosRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/linhas', linhasRoutes);
app.use('/api/v1/trajetos', trajetosRoutes);

module.exports = app;