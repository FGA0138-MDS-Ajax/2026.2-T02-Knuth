const emailService = require('../services/emailService');

describe('EmailService', () => {
  it('registra o envio do código de recuperação com destinatário e validade', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await emailService.enviarCodigoRecuperacao('maria@email.com', 'Maria', '123456', 15);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const mensagem = logSpy.mock.calls[0][0];
    expect(mensagem).toContain('Maria <maria@email.com>');
    expect(mensagem).toContain('123456');
    expect(mensagem).toContain('15 minutos');
    logSpy.mockRestore();
  });
});
