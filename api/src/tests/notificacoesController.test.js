const request = require('supertest');
const express = require('express');

jest.mock('../services/notificacoesService');

const service = require('../services/notificacoesService');
const controller = require('../controllers/notificacoesController');

let usuarioLogado;

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.usuario = usuarioLogado;
  next();
});
app.get('/notificacoes', controller.listar);
app.get('/notificacoes/nao-lidas', controller.contarNaoLidas);
app.put('/notificacoes/:id/lida', controller.marcarComoLida);

const erroComStatus = (mensagem, status) => Object.assign(new Error(mensagem), { status });

describe('notificacoesController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    usuarioLogado = { id: 3, tipo: 'PASSAGEIRO' };
  });

  describe('GET /notificacoes', () => {
    it('deve responder 200 com as notificações do usuário logado', async () => {
      service.listar.mockResolvedValue([{ id: 1, titulo: 'Desvio', lida: false }]);

      const resposta = await request(app).get('/notificacoes');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([{ id: 1, titulo: 'Desvio', lida: false }]);
      expect(service.listar).toHaveBeenCalledWith(3);
    });

    it('deve responder 403 para quem não é passageiro', async () => {
      usuarioLogado = { id: 1, tipo: 'ADMIN' };

      const resposta = await request(app).get('/notificacoes');

      expect(resposta.status).toBe(403);
      expect(resposta.body.erro).toBe('FORBIDDEN');
      expect(service.listar).not.toHaveBeenCalled();
    });

    it('deve responder 500 em falha inesperada', async () => {
      service.listar.mockRejectedValue(new Error('falha'));

      const resposta = await request(app).get('/notificacoes');

      expect(resposta.status).toBe(500);
      expect(resposta.body.erro).toBe('INTERNAL_ERROR');
    });
  });

  describe('GET /notificacoes/nao-lidas', () => {
    it('deve responder 200 com a quantidade de não lidas', async () => {
      service.contarNaoLidas.mockResolvedValue(4);

      const resposta = await request(app).get('/notificacoes/nao-lidas');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ naoLidas: 4 });
      expect(service.contarNaoLidas).toHaveBeenCalledWith(3);
    });

    it('deve responder 403 para quem não é passageiro', async () => {
      usuarioLogado = { id: 1, tipo: 'ADMIN' };

      const resposta = await request(app).get('/notificacoes/nao-lidas');

      expect(resposta.status).toBe(403);
      expect(service.contarNaoLidas).not.toHaveBeenCalled();
    });
  });

  describe('PUT /notificacoes/:id/lida', () => {
    it('deve responder 200 com a notificação marcada como lida', async () => {
      service.marcarComoLida.mockResolvedValue({ id: 5, lida: true });

      const resposta = await request(app).put('/notificacoes/5/lida');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ id: 5, lida: true });
      expect(service.marcarComoLida).toHaveBeenCalledWith('5', 3);
    });

    it('deve responder 404 quando a notificação não existe', async () => {
      service.marcarComoLida.mockRejectedValue(erroComStatus('Notificação não encontrada.', 404));

      const resposta = await request(app).put('/notificacoes/99/lida');

      expect(resposta.status).toBe(404);
      expect(resposta.body.erro).toBe('NOT_FOUND');
    });

    it('deve responder 403 para quem não é passageiro', async () => {
      usuarioLogado = { id: 1, tipo: 'ADMIN' };

      const resposta = await request(app).put('/notificacoes/5/lida');

      expect(resposta.status).toBe(403);
      expect(service.marcarComoLida).not.toHaveBeenCalled();
    });
  });
});
