const express = require('express');
const cors = require('cors');

const linhasRoutes = require('./routes/linhasRoutes');
const buscasRecentesRoutes = require('./routes/buscasRecentesRoutes');
const trajetosRoutes = require('./routes/trajetosRoutes');
const paradasRoutes = require('./routes/paradasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const alertasRoutes = require('./routes/alertasRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/linhas', linhasRoutes);
app.use('/api/v1', buscasRecentesRoutes);
app.use('/api/v1/trajetos', trajetosRoutes);
app.use('/api/v1/paradas', paradasRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/alertas', alertasRoutes);

module.exports = app;