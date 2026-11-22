const { api, resetarDados, encerrarConexoes } = require('./auxiliares');

beforeAll(resetarDados);
afterAll(encerrarConexoes);

// -----testes------

describe('Sistema - consultas públicas', () => {
  describe('linhas', () => {
    it('lista as linhas cadastradas sem alertas quando não há nenhum vigente', async () => {
      const resposta = await api().get('/api/v1/linhas');

      expect(resposta.status).toBe(200);
      expect(resposta.body.map((l) => l.id).sort()).toEqual(['9001', '9002', '9003']);
      resposta.body.forEach((linha) => {
        expect(linha).toMatchObject({ afetadaPorAlerta: false, alertas: [] });
      });
    });

    it('busca por código e por nome sem diferenciar maiúsculas de minúsculas', async () => {
      const porCodigo = await api().get('/api/v1/linhas').query({ busca: '0.9002' });
      const porNome = await api().get('/api/v1/linhas').query({ busca: 'sistema beta' });

      expect(porCodigo.body.map((l) => l.id)).toEqual(['9002']);
      expect(porNome.body.map((l) => l.id)).toEqual(['9002']);
      expect(porNome.body[0]).toMatchObject({ codigo: '0.9002', nome: 'Sistema Beta', cor: '#00FF00' });
    });

    it('devolve lista vazia quando nada corresponde à busca', async () => {
      const resposta = await api().get('/api/v1/linhas').query({ busca: 'linha-que-nao-existe' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([]);
    });
  });

  describe('itinerário', () => {
    it('devolve as paradas de ida e de volta na ordem da viagem', async () => {
      const resposta = await api().get('/api/v1/linhas/9001/itinerario');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({
        linhaId: '9001',
        codigo: '0.9001',
        nome: 'Sistema Alfa',
        cor: '#FF0000',
        afetadaPorAlerta: false,
      });
      expect(resposta.body.itinerario.IDA.map((p) => p.nome)).toEqual([
        'Parada Sistema Alfa',
        'Parada Sistema Beta',
        'Parada Sistema Gama',
      ]);
      expect(resposta.body.itinerario.VOLTA.map((p) => p.nome)).toEqual([
        'Parada Sistema Gama',
        'Parada Sistema Beta',
        'Parada Sistema Alfa',
      ]);
      expect(resposta.body.itinerario.IDA.map((p) => p.sequencia)).toEqual([1, 2, 3]);
    });

    it('converte as coordenadas das paradas para número', async () => {
      const resposta = await api().get('/api/v1/linhas/9001/itinerario');
      const primeira = resposta.body.itinerario.IDA[0];

      expect(typeof primeira.latitude).toBe('number');
      expect(primeira.latitude).toBeCloseTo(-15.7942, 4);
      expect(primeira.longitude).toBeCloseTo(-47.8825, 4);
    });

    it('rejeita id fora do formato numérico', async () => {
      const resposta = await api().get('/api/v1/linhas/abc/itinerario');

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'O ID da linha é obrigatório.' });
    });

    it.each(['9999', '9003'])('responde 404 para a linha %s sem itinerário', async (id) => {
      const resposta = await api().get(`/api/v1/linhas/${id}/itinerario`);

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({
        erro: 'NOT_FOUND',
        detalhes: 'Itinerário não encontrado para a linha informada.',
      });
    });
  });

  describe('quadro de horários', () => {
    it('agrupa as partidas por sentido e tipo de dia em ordem crescente', async () => {
      const resposta = await api().get('/api/v1/linhas/9001/horarios');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({ linhaId: '9001', codigo: '0.9001', nome: 'Sistema Alfa' });
      expect(resposta.body.quadroHorarios).toEqual({
        IDA: { DIA_UTIL: ['08:00', '09:00'], SABADO: ['10:00'], DOMINGO_FERIADO: [] },
        VOLTA: { DIA_UTIL: ['18:00'], SABADO: [], DOMINGO_FERIADO: [] },
      });
    });

    it('mostra apenas os horários da própria linha', async () => {
      const resposta = await api().get('/api/v1/linhas/9002/horarios');

      expect(resposta.body.quadroHorarios.IDA.DIA_UTIL).toEqual(['08:30']);
      expect(resposta.body.quadroHorarios.VOLTA.DIA_UTIL).toEqual([]);
    });

    it.each(['9999', '9003'])('responde 404 para a linha %s sem horários', async (id) => {
      const resposta = await api().get(`/api/v1/linhas/${id}/horarios`);

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({
        erro: 'NOT_FOUND',
        detalhes: 'Quadro de horários não encontrado para a linha informada.',
      });
    });
  });

  describe('paradas', () => {
    it('busca paradas pelo nome e coloca a correspondência exata primeiro', async () => {
      const resposta = await api().get('/api/v1/paradas').query({ busca: 'Parada Sistema Alfa' });

      expect(resposta.status).toBe(200);
      expect(resposta.body[0]).toMatchObject({ id: '9101', nome: 'Parada Sistema Alfa' });
    });

    it('encontra várias paradas por um termo comum e respeita o limite', async () => {
      const todas = await api().get('/api/v1/paradas').query({ busca: 'Parada Sistema' });
      const limitada = await api().get('/api/v1/paradas').query({ busca: 'Parada Sistema', limite: 2 });

      expect(todas.body.map((p) => p.id).sort()).toEqual(['9101', '9102', '9103', '9104', '9105']);
      expect(limitada.body).toHaveLength(2);
    });

    it('ignora acentos e maiúsculas na busca', async () => {
      const semAcento = await api().get('/api/v1/paradas').query({ busca: 'estacao julia' });
      const comAcento = await api().get('/api/v1/paradas').query({ busca: 'ESTAÇÃO JÚLIA' });

      expect(semAcento.body.map((p) => p.id)).toContain('9106');
      expect(comAcento.body.map((p) => p.id)).toContain('9106');
    });

    it('devolve lista vazia para termos curtos ou ausentes', async () => {
      const curto = await api().get('/api/v1/paradas').query({ busca: 'a' });
      const ausente = await api().get('/api/v1/paradas');

      expect(curto.status).toBe(200);
      expect(curto.body).toEqual([]);
      expect(ausente.body).toEqual([]);
    });

    it('exige latitude e longitude para achar a parada mais próxima', async () => {
      const resposta = await api().get('/api/v1/paradas/proximas').query({ lat: '-15.79' });

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({
        erro: 'BAD_REQUEST',
        detalhes: 'Os parâmetros lat e lng são obrigatórios.',
      });
    });

    it.each([
      ['-15.7943', '-47.8826', '9101', 'Parada Sistema Alfa'],
      ['-15.8741', '-48.0424', '9105', 'Parada Sistema Epsilon'],
      ['-15.5001', '-47.5001', '9106', 'Estação Júlia Sistema'],
    ])('acha a parada mais próxima de (%s, %s)', async (lat, lng, id, nome) => {
      const resposta = await api().get('/api/v1/paradas/proximas').query({ lat, lng });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({ id, nome, afetadaPorAlerta: false, alertas: [] });
    });
  });

  describe('trajetos', () => {
    it('exige origem e destino', async () => {
      const resposta = await api().get('/api/v1/trajetos').query({ origem: 'Parada Sistema Alfa' });

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({
        erro: 'BAD_REQUEST',
        detalhes: 'Os parâmetros origem e destino são obrigatórios.',
      });
    });

    it('devolve lista vazia quando a origem ou o destino não existem', async () => {
      const resposta = await api()
        .get('/api/v1/trajetos')
        .query({ origem: 'Lugar Inexistente', destino: 'Parada Sistema Gama' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([]);
    });

    it('calcula as viagens diretas em ordem de horário, sem baldeação', async () => {
      const resposta = await api()
        .get('/api/v1/trajetos')
        .query({ origem: 'Parada Sistema Alfa', destino: 'Parada Sistema Gama' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.map((o) => o.partida)).toEqual(['08:00:00', '09:00:00']);
      resposta.body.forEach((opcao) => {
        expect(opcao).toMatchObject({
          chegada: expect.any(String),
          duracaoMinutos: 20,
          baldeacoes: 0,
          caminhadaMetros: 0,
          afetadaPorAlerta: false,
          alertas: [],
        });
        expect(opcao.etapas).toEqual([
          {
            ordem: 1,
            duracaoMinutos: 20,
            tipo: 'ONIBUS',
            instrucao:
              'Embarque na linha 0.9001 em "Parada Sistema Alfa" e desça em "Parada Sistema Gama" após 2 paradas.',
          },
        ]);
      });
    });

    it('monta a opção com uma baldeação quando não há linha direta', async () => {
      const resposta = await api()
        .get('/api/v1/trajetos')
        .query({ origem: 'Parada Sistema Alfa', destino: 'Parada Sistema Epsilon' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toHaveLength(1);
      expect(resposta.body[0]).toMatchObject({
        partida: '08:00:00',
        chegada: '08:50:00',
        duracaoMinutos: 50,
        baldeacoes: 1,
      });
      expect(resposta.body[0].etapas).toEqual([
        {
          ordem: 1,
          duracaoMinutos: 25,
          tipo: 'ONIBUS',
          instrucao:
            'Embarque na linha 0.9001 em "Parada Sistema Alfa" e desça em "Parada Sistema Gama" após 2 paradas.',
        },
        {
          ordem: 2,
          duracaoMinutos: 10,
          tipo: 'CAMINHADA',
          instrucao: 'Faça a baldeação na parada "Parada Sistema Gama". Aguarde o próximo ônibus.',
        },
        {
          ordem: 3,
          duracaoMinutos: 25,
          tipo: 'ONIBUS',
          instrucao: 'Embarque na linha 0.9002 e desça em "Parada Sistema Epsilon" após 2 paradas.',
        },
      ]);
    });

    it('não oferece trajeto no sentido contrário ao da viagem', async () => {
      const resposta = await api()
        .get('/api/v1/trajetos')
        .query({ origem: 'Parada Sistema Epsilon', destino: 'Parada Sistema Alfa' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([]);
    });
  });
});
