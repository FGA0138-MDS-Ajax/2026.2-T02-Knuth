// RF16 - Envio do código de recuperação de senha.
// O projeto ainda não possui provedor de e-mail (SMTP) configurado; por isso o
// envio é simulado e registrado no console do servidor. Para produção, basta
// substituir a implementação deste método por um provedor real, mantendo a assinatura.
class EmailService {
  async enviarCodigoRecuperacao(email, nome, codigo, validadeMinutos) {
    console.log(
      `[RotasDF] E-mail de recuperação de senha para ${nome} <${email}>: ` +
      `código ${codigo} (válido por ${validadeMinutos} minutos).`
    );
  }
}

module.exports = new EmailService();
