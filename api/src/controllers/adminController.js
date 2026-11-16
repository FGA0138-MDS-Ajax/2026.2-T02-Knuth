const adminService = require('../services/adminService');

class AdminController {
  async criarAdministrador(req, res) {
    try {
      const { nome, email, senha } = req.body;
      const admin = await adminService.criarAdministrador(nome, email, senha);
      return res.status(201).json(admin);
    } catch (error) {
      return res.status(400).json({ erro: 'BAD_REQUEST', detalhes: error.message });
    }
  }
}

module.exports = new AdminController();