const repository = require('../repositories/notificacoesRepository');
const emailService = require('../services/notificacaoEmailService');
const service = require('../services/notificacoesService');

jest.mock('../repositories/notificacoesRepository');
jest.mock('../services/notificacaoEmailService');

describe('notificacoesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('notificarFavoritosAfetados', () => {
    const alerta = {
      id: 7,
      titulo: 'Desvio',
      descricao: 'Desvio na linha 0.111',
      linhas: ['0.111'],
      paradas: ['P1']
    };

    it('grava as notificações e envia um e-mail para cada destinatário', async () => {
      repository.criarParaFavoritosAfetados.mockResolvedValue([
        { usuario_id: 3, item_tipo: 'LINHA', item_id: '0.111', nome: 'Ana', email: 'ana@exemplo.com' },
        { usuario_id: 4, item_tipo: 'PARADA', item_id: 'P1', nome: 'Bia', email: 'bia@exemplo.com' }
      ]);

      const total = await service.notificarFavoritosAfetados(alerta);

      expect(repository.criarParaFavoritosAfetados).toHaveBeenCalledWith({
        alertaId: 7,
        titulo: 'Desvio',
        resumo: 'Desvio na linha 0.111',
        linhas: ['0.111'],
        paradas: ['P1']
      });
      expect(emailService.enviarNotificacaoAlerta).toHaveBeenCalledTimes(2);
      expect(emailService.enviarNotificacaoAlerta).toHaveBeenCalledWith({
        email: 'ana@exemplo.com',
        nome: 'Ana',
        itemTipo: 'LINHA',
        itemId: '0.111',
        titulo: 'Desvio',
        resumo: 'Desvio na linha 0.111'
      });
      expect(total).toBe(2);
    });

    it('não envia e-mail quando ninguém favoritou os itens afetados', async () => {
      repository.criarParaFavoritosAfetados.mockResolvedValue([]);

      const total = await service.notificarFavoritosAfetados(alerta);

      expect(emailService.enviarNotificacaoAlerta).not.toHaveBeenCalled();
      expect(total).toBe(0);
    });

    it('continua enviando aos demais quando o e-mail de um destinatário falha', async () => {
      repository.criarParaFavoritosAfetados.mockResolvedValue([
        { usuario_id: 3, item_tipo: 'LINHA', item_id: '0.111', nome: 'Ana', email: 'ana@exemplo.com' },
        { usuario_id: 4, item_tipo: 'LINHA', item_id: '0.111', nome: 'Bia', email: 'bia@exemplo.com' }
      ]);
      emailService.enviarNotificacaoAlerta.mockRejectedValueOnce(new Error('falha no envio'));

      const total = await service.notificarFavoritosAfetados(alerta);

      expect(emailService.enviarNotificacaoAlerta).toHaveBeenCalledTimes(2);
      expect(total).toBe(2);
    });
  });

  describe('listar, contar e marcar como lida', () => {
    it('repassa a listagem ao repositório', async () => {
      repository.listarPorUsuario.mockResolvedValue([{ id: 1 }]);

      const resultado = await service.listar(3);

      expect(repository.listarPorUsuario).toHaveBeenCalledWith(3);
      expect(resultado).toEqual([{ id: 1 }]);
    });

    it('devolve a contagem de não lidas', async () => {
      repository.contarNaoLidas.mockResolvedValue(4);

      const resultado = await service.contarNaoLidas(3);

      expect(repository.contarNaoLidas).toHaveBeenCalledWith(3);
      expect(resultado).toBe(4);
    });

    it('marca como lida e devolve a notificação', async () => {
      repository.marcarComoLida.mockResolvedValue({ id: 5, lida: true });

      const resultado = await service.marcarComoLida(5, 3);

      expect(repository.marcarComoLida).toHaveBeenCalledWith(5, 3);
      expect(resultado).toEqual({ id: 5, lida: true });
    });

    it('lança erro quando a notificação não existe ou é de outro usuário', async () => {
      repository.marcarComoLida.mockResolvedValue(null);

      await expect(service.marcarComoLida(99, 3)).rejects.toThrow('Notificação não encontrada.');
    });
  });

  describe('erros', () => {
    it('marca o erro de notificação inexistente com status 404', async () => {
      repository.marcarComoLida.mockResolvedValue(null);

      await expect(service.marcarComoLida(99, 3)).rejects.toMatchObject({ status: 404 });
    });
  });
});
