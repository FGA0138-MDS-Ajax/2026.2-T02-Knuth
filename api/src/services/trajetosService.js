const calculadoraDeTrajetos = require('./calculadoraDeTrajetos');

class TrajetosService {
  async buscar(consulta) {
    const opcoes = await calculadoraDeTrajetos.calcular(consulta);
    
    return opcoes;
  }
}

module.exports = new TrajetosService();