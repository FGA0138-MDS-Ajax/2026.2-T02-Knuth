const alertasRepository = require('../repositories/alertasRepository');

class AlertasService {
  // RF13 - Lista todos os alertas vigentes
  async listarAlertasVigentes() {
    return await alertasRepository.findAlertasVigentes();
  }

  // RF13 - Consulta um alerta vigente pelo id
  async obterAlertaVigente(id) {
    return await alertasRepository.findAlertaVigenteById(id);
  }
}

module.exports = new AlertasService();
