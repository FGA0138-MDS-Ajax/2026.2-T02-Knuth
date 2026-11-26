const request = require('supertest');
const express = require('express');

jest.mock('../services/linhasService', () => ({
  criarLinha: jest.fn(),
  editarLinha: jest.fn(),
  excluirLinha: jest.fn(),
  listarPartidas: jest.fn(),
  incluirPartida: jest.fn(),
  alterarPartida: jest.fn(),
  excluirPartida: jest.fn(),
  incluirParadaNoItinerario: jest.fn(),
  removerParadaDoItinerario: jest.fn(),
}));

jest.mock('../services/paradasService', () => ({
  obterParada: jest.fn(),
  criarParada: jest.fn(),
  editarParada: jest.fn(),
  excluirParada: jest.fn(),
}));

const linhasService = require('../services/linhasService');
const paradasService = require('../services/paradasService');
const controller = require('../controllers/manterLinhasParadasController');

const app = express();
app.use(express.json());
app.post('/linhas', controller.criarLinha);
app.put('/linhas/:id', controller.editarLinha);
app.delete('/linhas/:id', controller.excluirLinha);
app.get('/linhas/:id/partidas', controller.listarPartidas);
app.post('/linhas/:id/partidas', controller.incluirPartida);
app.put('/linhas/:id/partidas/:viagemId', controller.alterarPartida);
app.delete('/linhas/:id/partidas/:viagemId', controller.excluirPartida);
app.post('/linhas/:id/itinerario', controller.incluirParadaNoItinerario);
app.delete('/linhas/:id/itinerario/:sentido/:sequencia', controller.removerParadaDoItinerario);
app.get('/paradas/:id', controller.obterParada);
app.post('/paradas', controller.criarParada);
app.put('/paradas/:id', controller.editarParada);
app.delete('/paradas/:id', controller.excluirParada);

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

  describe('GET /linhas/:id/partidas', () => {
    it('deve responder 200 com as partidas do sentido e tipo de dia', async () => {
      linhasService.listarPartidas.mockResolvedValue([{ viagemId: 'TRIP_1', horario: '05:00' }]);

      const resposta = await request(app).get('/linhas/0.110/partidas').query({ sentido: 'IDA', tipoDia: 'SABADO' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([{ viagemId: 'TRIP_1', horario: '05:00' }]);
      expect(linhasService.listarPartidas).toHaveBeenCalledWith('0.110', 'IDA', 'SABADO');
    });

    it('deve responder 400 quando o sentido ou o tipo de dia forem inválidos', async () => {
      linhasService.listarPartidas.mockRejectedValue(erroComStatus('O sentido deve ser IDA ou VOLTA.', 400));

      const resposta = await request(app).get('/linhas/0.110/partidas');

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'O sentido deve ser IDA ou VOLTA.' });
      expect(linhasService.listarPartidas).toHaveBeenCalledWith('0.110', undefined, undefined);
    });

    it('deve responder 500 em erro inesperado', async () => {
      linhasService.listarPartidas.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).get('/linhas/0.110/partidas').query({ sentido: 'IDA', tipoDia: 'SABADO' });

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao listar as partidas.' });
    });
  });

  describe('POST /linhas/:id/partidas', () => {
    it('deve responder 201 com a partida criada', async () => {
      const corpo = { sentido: 'IDA', tipoDia: 'SABADO', horario: '05:07' };
      linhasService.incluirPartida.mockResolvedValue({ viagemId: 'MANUAL_1', horario: '05:07' });

      const resposta = await request(app).post('/linhas/0.110/partidas').send(corpo);

      expect(resposta.status).toBe(201);
      expect(resposta.body).toEqual({ viagemId: 'MANUAL_1', horario: '05:07' });
      expect(linhasService.incluirPartida).toHaveBeenCalledWith('0.110', corpo);
    });

    it('deve responder 409 quando já houver partida no horário', async () => {
      const mensagem = 'Já existe uma partida às 05:07 neste sentido e tipo de dia.';
      linhasService.incluirPartida.mockRejectedValue(erroComStatus(mensagem, 409));

      const resposta = await request(app).post('/linhas/0.110/partidas').send({ horario: '05:07' });

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual({ erro: 'CONFLICT', detalhes: mensagem });
    });

    it('deve responder 500 em erro inesperado', async () => {
      linhasService.incluirPartida.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).post('/linhas/0.110/partidas').send({ horario: '05:07' });

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao incluir a partida.' });
    });
  });

  describe('PUT /linhas/:id/partidas/:viagemId', () => {
    it('deve responder 200 com a partida alterada', async () => {
      linhasService.alterarPartida.mockResolvedValue({ viagemId: 'TRIP_1', horario: '05:10' });

      const resposta = await request(app).put('/linhas/0.110/partidas/TRIP_1').send({ horario: '05:10' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ viagemId: 'TRIP_1', horario: '05:10' });
      expect(linhasService.alterarPartida).toHaveBeenCalledWith('0.110', 'TRIP_1', { horario: '05:10' });
    });

    it('deve responder 404 quando a partida não for da linha', async () => {
      linhasService.alterarPartida.mockRejectedValue(erroComStatus('Partida não encontrada.', 404));

      const resposta = await request(app).put('/linhas/0.110/partidas/TRIP_X').send({ horario: '05:10' });

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Partida não encontrada.' });
    });

    it('deve responder 500 em erro inesperado', async () => {
      linhasService.alterarPartida.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).put('/linhas/0.110/partidas/TRIP_1').send({ horario: '05:10' });

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao alterar a partida.' });
    });
  });

  describe('DELETE /linhas/:id/partidas/:viagemId', () => {
    it('deve responder 200 ao excluir', async () => {
      linhasService.excluirPartida.mockResolvedValue();

      const resposta = await request(app).delete('/linhas/0.110/partidas/TRIP_1');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ mensagem: 'Partida excluída.' });
      expect(linhasService.excluirPartida).toHaveBeenCalledWith('0.110', 'TRIP_1');
    });

    it('deve responder 404 quando a partida não for da linha', async () => {
      linhasService.excluirPartida.mockRejectedValue(erroComStatus('Partida não encontrada.', 404));

      const resposta = await request(app).delete('/linhas/0.110/partidas/TRIP_X');

      expect(resposta.status).toBe(404);
      expect(resposta.body.erro).toBe('NOT_FOUND');
    });

    it('deve responder 500 em erro inesperado', async () => {
      linhasService.excluirPartida.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).delete('/linhas/0.110/partidas/TRIP_1');

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao excluir a partida.' });
    });
  });

  describe('POST /linhas/:id/itinerario', () => {
    it('deve responder 201 ao incluir a parada no itinerário', async () => {
      const corpo = { sentido: 'IDA', paradaId: '6710', depoisDaSequencia: 1 };
      linhasService.incluirParadaNoItinerario.mockResolvedValue();

      const resposta = await request(app).post('/linhas/2302/itinerario').send(corpo);

      expect(resposta.status).toBe(201);
      expect(resposta.body).toEqual({ mensagem: 'Parada incluída no itinerário.' });
      expect(linhasService.incluirParadaNoItinerario).toHaveBeenCalledWith('2302', corpo);
    });

    it('deve responder 409 quando a parada já estiver no itinerário', async () => {
      const mensagem = 'A parada já faz parte do itinerário deste sentido.';
      linhasService.incluirParadaNoItinerario.mockRejectedValue(erroComStatus(mensagem, 409));

      const resposta = await request(app).post('/linhas/2302/itinerario').send({ sentido: 'IDA', paradaId: '7032' });

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual({ erro: 'CONFLICT', detalhes: mensagem });
    });

    it('deve responder 500 em erro inesperado', async () => {
      linhasService.incluirParadaNoItinerario.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).post('/linhas/2302/itinerario').send({ sentido: 'IDA', paradaId: '6710' });

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao incluir a parada no itinerário.',
      });
    });
  });

  describe('DELETE /linhas/:id/itinerario/:sentido/:sequencia', () => {
    it('deve responder 200 ao remover a parada do itinerário', async () => {
      linhasService.removerParadaDoItinerario.mockResolvedValue();

      const resposta = await request(app).delete('/linhas/2302/itinerario/IDA/5');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ mensagem: 'Parada removida do itinerário.' });
      expect(linhasService.removerParadaDoItinerario).toHaveBeenCalledWith('2302', 'IDA', '5');
    });

    it('deve responder 404 quando não houver parada na posição', async () => {
      linhasService.removerParadaDoItinerario.mockRejectedValue(
        erroComStatus('Parada não encontrada no itinerário.', 404)
      );

      const resposta = await request(app).delete('/linhas/2302/itinerario/IDA/99');

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Parada não encontrada no itinerário.' });
    });

    it('deve responder 500 em erro inesperado', async () => {
      linhasService.removerParadaDoItinerario.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).delete('/linhas/2302/itinerario/IDA/5');

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({
        erro: 'INTERNAL_ERROR',
        detalhes: 'Erro interno ao remover a parada do itinerário.',
      });
    });
  });

  describe('GET /paradas/:id', () => {
    it('deve responder 200 com a parada', async () => {
      paradasService.obterParada.mockResolvedValue({ id: '3369', nome: 'Rodoviária' });

      const resposta = await request(app).get('/paradas/3369');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ id: '3369', nome: 'Rodoviária' });
      expect(paradasService.obterParada).toHaveBeenCalledWith('3369');
    });

    it('deve responder 404 quando a parada não existir', async () => {
      paradasService.obterParada.mockRejectedValue(erroComStatus('Parada não encontrada.', 404));

      const resposta = await request(app).get('/paradas/999');

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Parada não encontrada.' });
    });

    it('deve responder 500 em erro inesperado', async () => {
      paradasService.obterParada.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).get('/paradas/3369');

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao consultar a parada.' });
    });
  });

  describe('POST /paradas', () => {
    it('deve responder 201 com a parada criada', async () => {
      const corpo = { codigo: '3369', nome: 'Rodoviária', latitude: -15.79, longitude: -47.88 };
      paradasService.criarParada.mockResolvedValue({ id: '3369', ...corpo });

      const resposta = await request(app).post('/paradas').send(corpo);

      expect(resposta.status).toBe(201);
      expect(resposta.body.id).toBe('3369');
      expect(paradasService.criarParada).toHaveBeenCalledWith(corpo);
    });

    it('deve repassar um objeto vazio quando não houver corpo', async () => {
      paradasService.criarParada.mockRejectedValue(erroComStatus('O código da parada é obrigatório.', 400));

      const resposta = await request(app).post('/paradas');

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'O código da parada é obrigatório.' });
      expect(paradasService.criarParada).toHaveBeenCalledWith({});
    });

    it('deve responder 409 quando o código já existir', async () => {
      paradasService.criarParada.mockRejectedValue(erroComStatus('Já existe uma parada com o código 3369.', 409));

      const resposta = await request(app).post('/paradas').send({ codigo: '3369' });

      expect(resposta.status).toBe(409);
      expect(resposta.body.erro).toBe('CONFLICT');
    });

    it('deve responder 500 em erro inesperado', async () => {
      paradasService.criarParada.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).post('/paradas').send({ codigo: '3369' });

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao incluir a parada.' });
    });
  });

  describe('PUT /paradas/:id', () => {
    it('deve responder 200 com a parada alterada', async () => {
      const corpo = { nome: 'Rodoviária do Plano Piloto', latitude: -15.79, longitude: -47.88 };
      paradasService.editarParada.mockResolvedValue({ id: '3369', ...corpo });

      const resposta = await request(app).put('/paradas/3369').send(corpo);

      expect(resposta.status).toBe(200);
      expect(resposta.body.nome).toBe('Rodoviária do Plano Piloto');
      expect(paradasService.editarParada).toHaveBeenCalledWith('3369', corpo);
    });

    it('deve responder 400 quando o service rejeitar os dados', async () => {
      paradasService.editarParada.mockRejectedValue(erroComStatus('A latitude é obrigatória.', 400));

      const resposta = await request(app).put('/paradas/3369').send({ nome: 'X' });

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'A latitude é obrigatória.' });
    });

    it('deve responder 500 em erro inesperado', async () => {
      paradasService.editarParada.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).put('/paradas/3369').send({ nome: 'X' });

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao alterar a parada.' });
    });
  });

  describe('DELETE /paradas/:id', () => {
    it('deve responder 200 ao excluir', async () => {
      paradasService.excluirParada.mockResolvedValue();

      const resposta = await request(app).delete('/paradas/3369');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ mensagem: 'Parada excluída.' });
      expect(paradasService.excluirParada).toHaveBeenCalledWith('3369');
    });

    it('deve responder 409 quando a parada estiver em algum itinerário', async () => {
      const mensagem = 'A parada não pode ser excluída porque faz parte do itinerário de 3 linhas.';
      paradasService.excluirParada.mockRejectedValue(erroComStatus(mensagem, 409));

      const resposta = await request(app).delete('/paradas/3369');

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual({ erro: 'CONFLICT', detalhes: mensagem });
    });

    it('deve responder 500 em erro inesperado', async () => {
      paradasService.excluirParada.mockRejectedValue(new Error('falha no banco'));

      const resposta = await request(app).delete('/paradas/3369');

      expect(resposta.status).toBe(500);
      expect(resposta.body).toEqual({ erro: 'INTERNAL_ERROR', detalhes: 'Erro interno ao excluir a parada.' });
    });
  });
});
