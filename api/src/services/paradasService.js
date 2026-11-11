const paradasRepository = require('../repositories/paradasRepository');

class ParadasService {
  async obterParadaMaisProxima(lat, lng) {
    return await paradasRepository.findNearestParada(lat, lng);
  }
}

module.exports = new ParadasService();