const express = require('express');
const cors = require('cors');
const linhasRoutes = require('./routes/linhasRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/linhas', linhasRoutes);

module.exports = app;