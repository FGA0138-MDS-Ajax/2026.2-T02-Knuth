const request = require('supertest');
const express = require('express');

jest.mock('../services/favoritosService');

const service = require('../services/favoritosService');
const controller = require('../controllers/favoritosController');

let usuarioLogado;

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.usuario = usuarioLogado;
  next();
});
app.get('/favoritos', controller.listar);
app.post('/favoritos', controller.adicionar);
app.delete('/favoritos/:id', controller.remover);

const erroComStatus = (mensagem, status) => Object.assign(new Error(mensagem), { status });

describe('favoritosController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    usuarioLogado = { id: 3, tipo: 'PASSAGEIRO' };
  });

  describe('GET /favoritos', () => {
    it('deve responder 200 com os favoritos do usuário logado', async () => {
      service.listar.mockResolvedValue([{ id: 1, tipo: 'LINHA' }]);

      const resposta = await request(app).get('/favoritos');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([{ id: 1, tipo: 'LINHA' }]);
      expect(service.listar).toHaveBeenCalledWith(3);
    });

    it('deve responder 403 para quem não é passageiro', async () => {
      usuarioLogado = { id: 1, tipo: 'ADMIN' };

      const resposta = await request(app).get('/favoritos');

      expect(resposta.status).toBe(403);
      expect(resposta.body).toEqual({
        erro: 'FORBIDDEN',
        detalhes: 'Apenas passageiros cadastrados podem usar favoritos.',
      });
      expect(service.listar).not.toHaveBeenCalled();
    });

    it('deve responder 500 sem expor o erro interno', async () => {
      service.listar.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).get('/favoritos');

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao processar favoritos.',
      });
    });
  });

  describe('POST /favoritos', () => {
    it('deve responder 201 ao salvar um favorito', async () => {
      const corpo = { tipo: 'LINHA', linhaId: '0.111-1' };
      service.adicionar.mockResolvedValue({ id: 7, ...corpo });

      const resposta = await request(app).post('/favoritos').send(corpo);

      expect(resposta.status).toBe(201);
      expect(resposta.body.id).toBe(7);
      expect(service.adicionar).toHaveBeenCalledWith(3, corpo);
    });

    it('deve responder 400 quando o service rejeitar os dados', async () => {
      service.adicionar.mockRejectedValue(erroComStatus('Tipo de favorito inválido.', 400));

      const resposta = await request(app).post('/favoritos').send({ tipo: 'ONIBUS' });

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'Tipo de favorito inválido.' });
    });

    it('deve responder 404 quando a linha ou a parada não existir', async () => {
      service.adicionar.mockRejectedValue(erroComStatus('Linha ou parada não encontrada.', 404));

      const resposta = await request(app).post('/favoritos').send({ tipo: 'LINHA', linhaId: 'x' });

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Linha ou parada não encontrada.' });
    });

    it('deve responder 409 quando o item já estiver nos favoritos', async () => {
      service.adicionar.mockRejectedValue(erroComStatus('Este item já está nos favoritos.', 409));

      const resposta = await request(app).post('/favoritos').send({ tipo: 'LINHA', linhaId: '0.111-1' });

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual({ erro: 'CONFLICT', detalhes: 'Este item já está nos favoritos.' });
    });

    it('deve responder 403 para quem não é passageiro', async () => {
      usuarioLogado = { id: 1, tipo: 'ADMIN' };

      const resposta = await request(app).post('/favoritos').send({ tipo: 'LINHA', linhaId: '0.111-1' });

      expect(resposta.status).toBe(403);
      expect(service.adicionar).not.toHaveBeenCalled();
    });

    it('deve responder 500 sem expor o erro interno', async () => {
      service.adicionar.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).post('/favoritos').send({ tipo: 'LINHA', linhaId: '0.111-1' });

      expect(resposta.status).toBe(500);
      expect(resposta.body.erro).toBe('INTERNAL_ERROR');
    });
  });

  describe('DELETE /favoritos/:id', () => {
    it('deve responder 200 ao remover', async () => {
      service.remover.mockResolvedValue();

      const resposta = await request(app).delete('/favoritos/7');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ mensagem: 'Favorito removido.' });
      expect(service.remover).toHaveBeenCalledWith(3, '7');
    });

    it('deve responder 404 quando o favorito não existir', async () => {
      service.remover.mockRejectedValue(erroComStatus('Favorito não encontrado.', 404));

      const resposta = await request(app).delete('/favoritos/99');

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Favorito não encontrado.' });
    });

    it('deve responder 400 quando o id for inválido', async () => {
      service.remover.mockRejectedValue(erroComStatus('ID inválido.', 400));

      const resposta = await request(app).delete('/favoritos/abc');

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'ID inválido.' });
    });

    it('deve responder 403 para quem não é passageiro', async () => {
      usuarioLogado = { id: 1, tipo: 'ADMIN' };

      const resposta = await request(app).delete('/favoritos/7');

      expect(resposta.status).toBe(403);
      expect(service.remover).not.toHaveBeenCalled();
    });
  });
});