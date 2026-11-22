const {
  api,
  cabecalho,
  criarPassageiroLogado,
  criarAdminLogado,
  resetarDados,
  encerrarConexoes,
} = require('./auxiliares');

let admin;
let passageiro;

function corpo(sobrescrever = {}) {
  return {
    tipo: 'HORARIO',
    descricao: 'O ônibus passou 15 minutos antes do horário previsto.',
    linhaId: '9001',
    ...sobrescrever,
  };
}

function reportar(sobrescrever) {
  return api().post('/api/v1/reportes').send(corpo(sobrescrever));
}

function listarReportes(consulta = {}) {
  return api().get('/api/v1/admin/reportes').query(consulta).set(cabecalho(admin.token));
}

function analisar(id, dados) {
  return api().patch(`/api/v1/admin/reportes/${id}`).set(cabecalho(admin.token)).send(dados);
}

beforeAll(async () => {
  await resetarDados();
  admin = await criarAdminLogado();
  passageiro = await criarPassageiroLogado();
});

afterAll(encerrarConexoes);

// -----testes------

describe('Sistema - reportes de divergência', () => {
  describe('registro pelo passageiro', () => {
    it('registra o reporte como pendente associado ao usuário', async () => {
      const resposta = await reportar({ usuarioId: passageiro.usuario.id });

      expect(resposta.status).toBe(201);
      expect(resposta.body).toMatchObject({
        id: expect.any(Number),
        tipo: 'HORARIO',
        linhaId: '9001',
        paradaId: null,
        usuarioId: passageiro.usuario.id,
        status: 'PENDENTE',
      });
    });

    it('normaliza o tipo e aceita reporte só com parada e sem usuário', async () => {
      const resposta = await reportar({ tipo: 'parada', linhaId: undefined, paradaId: '9102' });

      expect(resposta.status).toBe(201);
      expect(resposta.body).toMatchObject({ tipo: 'PARADA', linhaId: null, paradaId: '9102', usuarioId: null });
    });

    it.each([
      ['tipo inválido', { tipo: 'OUTRO' }, 'Tipo de divergência inválido. Use: HORARIO, PARADA ou ITINERARIO.'],
      ['descrição curta', { descricao: 'curta' }, 'A descrição da divergência deve ter pelo menos 10 caracteres.'],
      ['sem linha nem parada', { linhaId: undefined }, 'Informe ao menos a linha ou a parada relacionada à divergência.'],
    ])('rejeita reporte com %s', async (_descricao, alteracao, mensagem) => {
      const resposta = await reportar(alteracao);

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: mensagem });
    });
  });

  describe('controle de acesso à análise', () => {
    it('exige token de administrador', async () => {
      const semToken = await api().get('/api/v1/admin/reportes');
      const comoPassageiro = await api().get('/api/v1/admin/reportes').set(cabecalho(passageiro.token));

      expect(semToken.status).toBe(401);
      expect(comoPassageiro.status).toBe(403);
    });
  });

  describe('análise pelo administrador', () => {
    let horario;
    let parada;
    let itinerario;

    beforeAll(async () => {
      horario = (await reportar({ tipo: 'HORARIO', usuarioId: passageiro.usuario.id })).body;
      parada = (await reportar({ tipo: 'PARADA', linhaId: undefined, paradaId: '9103' })).body;
      itinerario = (await reportar({ tipo: 'ITINERARIO', linhaId: '9002' })).body;
    });

    it('lista os reportes pendentes e filtra por status e tipo', async () => {
      const todos = await listarReportes();
      const pendentes = await listarReportes({ status: 'PENDENTE' });
      const porTipo = await listarReportes({ tipo: 'PARADA' });

      expect(todos.status).toBe(200);
      expect(todos.body.map((r) => r.id)).toEqual(expect.arrayContaining([horario.id, parada.id, itinerario.id]));
      expect(pendentes.body.every((r) => r.status === 'PENDENTE')).toBe(true);
      expect(porTipo.body.every((r) => r.tipo === 'PARADA')).toBe(true);
      expect(porTipo.body.map((r) => r.id)).toContain(parada.id);
      expect(porTipo.body.map((r) => r.id)).not.toContain(horario.id);
    });

    it('rejeita filtros inválidos', async () => {
      const status = await listarReportes({ status: 'XYZ' });
      const tipo = await listarReportes({ tipo: 'XYZ' });

      expect(status.status).toBe(400);
      expect(status.body).toEqual({
        erro: 'BAD_REQUEST',
        detalhes: 'Status inválido. Use: PENDENTE, PROCEDENTE ou IMPROCEDENTE.',
      });
      expect(tipo.status).toBe(400);
      expect(tipo.body.detalhes).toBe('Tipo de divergência inválido. Use: HORARIO, PARADA ou ITINERARIO.');
    });

    it('detalha um reporte com os dados de quem reportou', async () => {
      const resposta = await api().get(`/api/v1/admin/reportes/${horario.id}`).set(cabecalho(admin.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({
        id: horario.id,
        usuarioId: passageiro.usuario.id,
        usuarioNome: passageiro.dados.nome,
        usuarioEmail: passageiro.dados.email,
        status: 'PENDENTE',
        observacaoAdmin: null,
        analisadoEm: null,
      });
    });

    it('trata ids inválidos e inexistentes na consulta', async () => {
      const invalido = await api().get('/api/v1/admin/reportes/abc').set(cabecalho(admin.token));
      const inexistente = await api().get('/api/v1/admin/reportes/99999999').set(cabecalho(admin.token));

      expect(invalido.status).toBe(400);
      expect(invalido.body.detalhes).toBe('ID do reporte inválido.');
      expect(inexistente.status).toBe(404);
      expect(inexistente.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Reporte não encontrado.' });
    });

    it('valida os dados da análise', async () => {
      const statusInvalido = await analisar(horario.id, { status: 'TALVEZ' });
      const semCorrecao = await analisar(horario.id, { status: 'PROCEDENTE' });
      const inexistente = await analisar(99999999, { status: 'IMPROCEDENTE' });

      expect(statusInvalido.status).toBe(400);
      expect(statusInvalido.body.detalhes).toBe('Status inválido. Use: PENDENTE, PROCEDENTE ou IMPROCEDENTE.');
      expect(semCorrecao.status).toBe(400);
      expect(semCorrecao.body.detalhes).toBe('Informe a correção realizada ao classificar o reporte como procedente.');
      expect(inexistente.status).toBe(404);
    });

    it('classifica como procedente registrando a correção', async () => {
      const resposta = await analisar(horario.id, {
        status: 'procedente',
        observacaoAdmin: 'Horário corrigido no quadro da linha.',
      });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({
        id: horario.id,
        status: 'PROCEDENTE',
        observacaoAdmin: 'Horário corrigido no quadro da linha.',
        analisadoEm: expect.any(String),
      });
    });

    it('aceita correcaoRealizada como alternativa a observacaoAdmin', async () => {
      const resposta = await analisar(parada.id, { status: 'PROCEDENTE', correcaoRealizada: 'Parada reposicionada.' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({ status: 'PROCEDENTE', observacaoAdmin: 'Parada reposicionada.' });
    });

    it('classifica como improcedente sem exigir observação', async () => {
      const resposta = await analisar(itinerario.id, { status: 'IMPROCEDENTE' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({
        status: 'IMPROCEDENTE',
        observacaoAdmin: null,
        analisadoEm: expect.any(String),
      });
    });

    it('reflete as análises nos filtros e mantém os pendentes no topo da lista', async () => {
      const procedentes = await listarReportes({ status: 'PROCEDENTE' });
      const improcedentes = await listarReportes({ status: 'IMPROCEDENTE' });
      const todos = await listarReportes();
      const status = todos.body.map((r) => r.status);
      const pendentesPrimeiro = [...status].sort((a, b) => (a === 'PENDENTE' ? 0 : 1) - (b === 'PENDENTE' ? 0 : 1));

      expect(procedentes.body.map((r) => r.id)).toEqual(expect.arrayContaining([horario.id, parada.id]));
      expect(improcedentes.body.map((r) => r.id)).toContain(itinerario.id);
      expect(status).toEqual(pendentesPrimeiro);
    });

    it('permite reabrir um reporte limpando a data de análise', async () => {
      const resposta = await analisar(itinerario.id, { status: 'PENDENTE' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({ status: 'PENDENTE', analisadoEm: null });
    });
  });
});
