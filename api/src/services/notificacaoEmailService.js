class NotificacaoEmailService {
  async enviarNotificacaoAlerta({ email, nome, itemTipo, itemId, titulo, resumo }) {
    const item = itemTipo === 'LINHA' ? `linha ${itemId}` : `parada ${itemId}`;
    console.log(
      `[RotasDF] E-mail de alerta para ${nome} <${email}>: ` +
      `a ${item}, que você favoritou, foi afetada. ${titulo}: ${resumo}`
    );
  }
}

module.exports = new NotificacaoEmailService();
