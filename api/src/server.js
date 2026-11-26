const app = require('./app');
const { garantirColunasEnriquecidas } = require('./config/garantirSchema');

const PORT = process.env.PORT || 3000;

garantirColunasEnriquecidas().finally(() => {
  app.listen(PORT, () => {
    console.log(`Servidor a rodar na porta ${PORT}`);
  });
});
