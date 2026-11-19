const request = require('supertest');
const express = require('express');

jest.mock('../services/gerenciarAlertasService');

const service = require('../services/gerenciarAlertasService');
const controller = require('../controllers/gerenciarAlertasController');

const app = express();
app.use(express.json());
app.get('/alertas', controller.listar);
app.post('/alertas', controller.criar);
app.put('/alertas/:id/encerrar', controller.encerrar);

describe('gerenciarAlertasController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /alertas', () => {
    it('deve responder 200 com a lista de alertas', async () => {
      service.listar.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const resposta = await request(app).get('/alertas');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('POST /alertas', () => {
    it('deve responder 201 ao criar um alerta', async () => {
      const corpo = { tipo: 'DESVIO', titulo: 'Desvio', descricao: 'Obras', data_inicio: '2026-11-20T08:00:00Z', data_fim: '2026-11-25T18:00:00Z', linhas: ['0.782'] };
      service.criar.mockResolvedValue({ id: 1, ...corpo });

      const resposta = await request(app).post('/alertas').send(corpo);

      expect(resposta.status).toBe(201);
      expect(resposta.body.id).toBe(1);
      expect(service.criar).toHaveBeenCalledWith(corpo);
    });

    it('deve responder 400 quando o service rejeitar os dados', async () => {
      service.criar.mockRejectedValue(new Error('Tipo de alerta inválido.'));

      const resposta = await request(app).post('/alertas').send({ tipo: 'OUTRO' });

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'Tipo de alerta inválido.' });
    });
  });

  describe('PUT /alertas/:id/encerrar', () => {
    it('deve responder 200 ao encerrar', async () => {
      service.encerrar.mockResolvedValue({ id: 5 });

      const resposta = await request(app).put('/alertas/5/encerrar');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ mensagem: 'Alerta encerrado.' });
      expect(service.encerrar).toHaveBeenCalledWith(5);
    });

    it('deve responder 404 quando o alerta não existir', async () => {
      service.encerrar.mockRejectedValue(new Error('Alerta não encontrado.'));

      const resposta = await request(app).put('/alertas/99/encerrar');

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Alerta não encontrado.' });
    });

    it('deve responder 400 quando o alerta já estiver encerrado', async () => {
      service.encerrar.mockRejectedValue(new Error('Este alerta já foi encerrado.'));

      const resposta = await request(app).put('/alertas/5/encerrar');

      expect(resposta.status).toBe(400);
      expect(resposta.body.erro).toBe('BAD_REQUEST');
    });

    it('deve responder 400 quando o id não for um número', async () => {
      const resposta = await request(app).put('/alertas/abc/encerrar');

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'ID inválido.' });
      expect(service.encerrar).not.toHaveBeenCalled();
    });
  });
});