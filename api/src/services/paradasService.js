const paradasRepository = require('../repositories/paradasRepository');

class ParadasService {
  async obterParadaMaisProxima(lat, lng) {
    return await paradasRepository.findNearestParada(lat, lng);
  }

  async buscarParadas(busca, limite = 10) {
    if (!busca || typeof busca !== 'string' || busca.trim().length < 2) {
      return [];
    }
    const limiteNumerico = Math.min(Math.max(parseInt(limite, 10) || 10, 1), 25);
    return await paradasRepository.buscarPorNome(busca.trim(), limiteNumerico);
  }
}

module.exports = new ParadasService();
