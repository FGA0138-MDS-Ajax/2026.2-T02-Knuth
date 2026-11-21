const request = require('supertest');
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Aumenta o timeout do Jest, pois o Docker demora alguns segundos para subir
jest.setTimeout(60000); 

let container;
let app;

// Como o alertasService não pertence ao módulo de linhas, vamos simulá-lo para focar no banco de linhas
jest.mock('../src/services/alertasService', () => ({
  listarAlertasVigentes: jest.fn().mockResolvedValue([]),
  vigentesPara: jest.fn().mockResolvedValue([]),
  filtrarAlertasParaItens: jest.fn().mockReturnValue([])
}));

describe('Integração REAL (Testcontainers) - API de Linhas', () => {
  
  beforeAll(async () => {
    // 1. Sobe um container temporário do PostgreSQL
    container = await new PostgreSqlContainer('postgres:15-alpine').start();

    // 2. Configura as variáveis de ambiente para apontar para o container
    process.env.DB_HOST = container.getHost();
    process.env.DB_PORT = container.getPort();
    process.env.DB_USER = container.getUsername();
    process.env.DB_PASSWORD = container.getPassword();
    process.env.DB_NAME = container.getDatabase();

    // 3. Lê e executa o seu init.sql dentro do banco temporário
    const client = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    await client.connect();

    // O caminho assume que o init.sql está na pasta infrastructure
    const initSqlPath = path.resolve(__dirname, '../../infrastructure/init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    await client.query(initSql);

    // 4. Insere dados de teste (um calendário, uma linha, uma viagem e horários)
    await client.query(`
      INSERT INTO calendario (id, tipo_dia, inicio, fim) VALUES ('C1', 'DIA_UTIL', '2026-01-01', '2026-12-31');
      INSERT INTO linhas (id, codigo, nome, cor) VALUES ('1', '0.600', 'Planaltina', '#FFF');
      INSERT INTO paradas (id, nome, latitude, longitude) VALUES ('P1', 'Terminal', -15.0, -47.0);
      INSERT INTO paradas (id, nome, latitude, longitude) VALUES ('P2', 'Rodoviária', -15.1, -47.1);
      INSERT INTO viagens (id, linha_id, calendario_id, sentido, destino) VALUES ('V1', '1', 'C1', 'IDA', 'Rodoviária');
      INSERT INTO horarios_paradas (viagem_id, parada_id, sequencia, partida, chegada) 
      VALUES ('V1', 'P1', 1, '05:00:00', '05:00:00'), ('V1', 'P2', 2, '05:30:00', '05:30:00');
    `);
    await client.end();

    // 5. Agora importamos o App do Express (ele vai usar as variáveis de ambiente do container)
    app = require('../src/app');
  });

  afterAll(async () => {
    // 6. Derruba o container após os testes
    if (container) {
      await container.stop();
    }
  });

  it('GET /api/v1/linhas - Deve buscar as linhas direto do banco PostgreSQL real', async () => {
    const response = await request(app).get('/api/v1/linhas?busca=0.600');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].codigo).toBe('0.600');
    expect(response.body[0].nome).toBe('Planaltina');
  });

  it('GET /api/v1/linhas/:id/itinerario - Deve montar o itinerário com os dados reais do banco', async () => {
    const response = await request(app).get('/api/v1/linhas/1/itinerario');
    
    expect(response.status).toBe(200);
    expect(response.body.codigo).toBe('0.600');
    expect(response.body.itinerario.IDA).toHaveLength(2);
    expect(response.body.itinerario.IDA[0].nome).toBe('Terminal');
  });

  it('GET /api/v1/linhas/:id/horarios - Deve retornar os horários reais do banco', async () => {
    const response = await request(app).get('/api/v1/linhas/1/horarios');
    
    expect(response.status).toBe(200);
    expect(response.body.quadroHorarios.IDA.DIA_UTIL[0]).toBe('05:00');
  });
});