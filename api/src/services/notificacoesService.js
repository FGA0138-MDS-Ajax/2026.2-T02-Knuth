const repository = require('../repositories/notificacoesRepository');
const emailService = require('./notificacaoEmailService');

const notificarFavoritosAfetados = async ({ id, titulo, descricao, linhas, paradas }) => {
  const destinatarios = await repository.criarParaFavoritosAfetados({
    alertaId: id,
    titulo,
    resumo: descricao,
    linhas,
    paradas
  });

  await Promise.all(
    destinatarios.map(async (destinatario) => {
      try {
        await emailService.enviarNotificacaoAlerta({
          email: destinatario.email,
          nome: destinatario.nome,
          itemTipo: destinatario.item_tipo,
          itemId: destinatario.item_id,
          titulo,
          resumo: descricao
        });
      } catch (erro) {
        console.error('Falha ao enviar e-mail de alerta:', erro.message || erro);
      }
    })
  );

  return destinatarios.length;
};

const listar = async (usuarioId) => repository.listarPorUsuario(usuarioId);

const contarNaoLidas = async (usuarioId) => repository.contarNaoLidas(usuarioId);

const marcarComoLida = async (id, usuarioId) => {
  const notificacao = await repository.marcarComoLida(id, usuarioId);
  if (!notificacao) throw Object.assign(new Error('Notificação não encontrada.'), { status: 404 });
  return notificacao;
};

module.exports = { notificarFavoritosAfetados, listar, contarNaoLidas, marcarComoLida };
