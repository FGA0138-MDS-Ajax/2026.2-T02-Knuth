const buscasRecentesRepository = require('../repositories/buscasRecentesRepository');

class BuscasRecentesService {
  async registrarBusca(origem, destino, usuarioId = null) {
    if (!origem || !destino) {
      throw new Error('Origem e destino são obrigatórios.');
    }
    return await buscasRecentesRepository.salvarBusca(origem.trim(), destino.trim(), usuarioId);
  }

  async obterBuscasRecentes(usuarioId = null, limite = 5) {
    const limiteNumerico = parseInt(limite, 10) || 5;
    return await buscasRecentesRepository.listarBuscasRecentes(usuarioId, limiteNumerico);
  }
}

module.exports = new BuscasRecentesService();