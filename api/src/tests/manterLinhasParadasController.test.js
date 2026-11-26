const request = require('supertest');
const express = require('express');

jest.mock('../services/linhasService', () => ({
  criarLinha: jest.fn(),
  editarLinha: jest.fn(),
  excluirLinha: jest.fn(),
}));

const linhasService = require('../services/linhasService');
const controller = require('../controllers/manterLinhasParadasController');

const app = express();
app.use(express.json());
app.post('/linhas', controller.criarLinha);
app.put('/linhas/:id', controller.editarLinha);
app.delete('/linhas/:id', controller.excluirLinha);

function erroComStatus(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

describe('manterLinhasParadasController', () => {
  let erroSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    erroSpy.mockRestore();
  });

  describe('POST /linhas', () => {
    it('deve responder 201 com a linha criada', async () => {
      const corpo = { codigo: '0.110', nome: 'Asa Sul' };
      linhasService.criarLinha.mockResolvedValue({ id: '0.110', ...corpo });

      const resposta = await request(app).post('/linhas').send(corpo);

      expect(resposta.status).toBe(201);
      expect(resposta.body).toEqual({ id: '0.110', codigo: '0.110', nome: 'Asa Sul' });
      expect(linhasService.criarLinha).toHaveBeenCalledWith(corpo);
    });

    it('deve repassar um objeto vazio quando não houver corpo', async () => {
      linhasService.criarLinha.mockRejectedValue(erroComStatus('O código da linha é obrigatório.', 400));

      const resposta = await request(app).post('/linhas');

      expect(resposta.status).toBe(400);
      expect(linhasService.criarLinha).toHaveBeenCalledWith({});
    });

    it('deve responder 400 quando o service rejeitar os dados', async () => {
      linhasService.criarLinha.mockRejectedValue(erroComStatus('O nome da linha é obrigatório.', 400));

      const resposta = await request(app).post('/linhas').send({ codigo: '0.110' });

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'O nome da linha é obrigatório.' });
    });

    it('deve responder 409 quando o código já existir', async () => {
      linhasService.criarLinha.mockRejectedValue(erroComStatus('Já existe uma linha com o código 0.110.', 409));

      const resposta = await request(app).post('/linhas').send({ codigo: '0.110', nome: 'Asa Sul' });

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual({ erro: 'CONFLICT', detalhes: 'Já existe uma linha com o código 0.110.' });
    });

    it('deve responder 500 em erro inesperado', async () => {
      linhasService.criarLinha.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).post('/linhas').send({ codigo: '0.110', nome: 'Asa Sul' });

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao incluir a linha.' });
      expect(erroSpy).toHaveBeenCalled();
    });
  });

  describe('PUT /linhas/:id', () => {
    it('deve responder 200 com a linha alterada', async () => {
      const corpo = { nome: 'Asa Norte' };
      linhasService.editarLinha.mockResolvedValue({ id: '0.110', nome: 'Asa Norte' });

      const resposta = await request(app).put('/linhas/0.110').send(corpo);

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ id: '0.110', nome: 'Asa Norte' });
      expect(linhasService.editarLinha).toHaveBeenCalledWith('0.110', corpo);
    });

    it('deve responder 404 quando a linha não existir', async () => {
      linhasService.editarLinha.mockRejectedValue(erroComStatus('Linha não encontrada.', 404));

      const resposta = await request(app).put('/linhas/999').send({ nome: 'X' });

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Linha não encontrada.' });
    });

    it('deve responder 500 em erro inesperado', async () => {
      linhasService.editarLinha.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).put('/linhas/0.110').send({ nome: 'X' });

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao alterar a linha.' });
    });
  });

  describe('DELETE /linhas/:id', () => {
    it('deve responder 200 ao excluir', async () => {
      linhasService.excluirLinha.mockResolvedValue();

      const resposta = await request(app).delete('/linhas/0.110');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ mensagem: 'Linha excluída.' });
      expect(linhasService.excluirLinha).toHaveBeenCalledWith('0.110');
    });

    it('deve responder 404 quando a linha não existir', async () => {
      linhasService.excluirLinha.mockRejectedValue(erroComStatus('Linha não encontrada.', 404));

      const resposta = await request(app).delete('/linhas/999');

      expect(resposta.status).toBe(404);
      expect(resposta.body.erro).toBe('NOT_FOUND');
    });

    it('deve responder 500 em erro inesperado', async () => {
      linhasService.excluirLinha.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).delete('/linhas/0.110');

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao excluir a linha.' });
    });
  });
});
