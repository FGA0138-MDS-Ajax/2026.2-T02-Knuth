const notificacaoEmailService = require('../services/notificacaoEmailService');

describe('notificacaoEmailService', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('enviarNotificacaoAlerta', () => {
    it('registra o e-mail com o destinatário, o item afetado e o resumo do alerta', async () => {
      await notificacaoEmailService.enviarNotificacaoAlerta({
        email: 'ana@exemplo.com',
        nome: 'Ana',
        itemTipo: 'LINHA',
        itemId: '0.111',
        titulo: 'Desvio',
        resumo: 'Desvio na linha 0.111'
      });

      expect(console.log).toHaveBeenCalledTimes(1);
      const mensagem = console.log.mock.calls[0][0];
      expect(mensagem).toContain('ana@exemplo.com');
      expect(mensagem).toContain('Ana');
      expect(mensagem).toContain('0.111');
      expect(mensagem).toContain('Desvio');
      expect(mensagem).toContain('Desvio na linha 0.111');
    });
  });
});
