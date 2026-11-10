const express = require('express');
const cors = require('cors');
const linhasRoutes = require('./routes/linhasRoutes');
const buscasRecentesRoutes = require('./routes/buscasRecentesRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/linhas', linhasRoutes);
app.use('/api/v1', buscasRecentesRoutes);

module.exports = app;