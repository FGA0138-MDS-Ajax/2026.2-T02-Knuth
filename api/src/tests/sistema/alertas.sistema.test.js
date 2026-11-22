const {
  api,
  cabecalho,
  isoEmHoras,
  criarPassageiroLogado,
  criarAdminLogado,
  resetarDados,
  encerrarConexoes,
} = require('./auxiliares');

let admin;
let passageiro;

function alertaBase(sobrescrever = {}) {
  return {
    tipo: 'DESVIO',
    titulo: 'Desvio por obras',
    descricao: 'Linha desviada por obras na via.',
    data_inicio: isoEmHoras(-1),
    data_fim: isoEmHoras(3),
    linhas: ['9001'],
    paradas: ['9101'],
    ...sobrescrever,
  };
}

function criarAlerta(sobrescrever) {
  return api().post('/api/v1/admin/alertas').set(cabecalho(admin.token)).send(alertaBase(sobrescrever));
}

function idsVigentes(consulta = {}) {
  return api()
    .get('/api/v1/alertas')
    .query(consulta)
    .then((resposta) => resposta.body.map((alerta) => alerta.id));
}

function listaAdmin() {
  return api().get('/api/v1/admin/alertas').set(cabecalho(admin.token));
}

beforeAll(async () => {
  await resetarDados();
  admin = await criarAdminLogado();
  passageiro = await criarPassageiroLogado();
});

afterAll(encerrarConexoes);

// -----testes------

describe('Sistema - alertas', () => {
  describe('controle de acesso', () => {
    it('exige token para gerenciar alertas', async () => {
      const resposta = await api().get('/api/v1/admin/alertas');

      expect(resposta.status).toBe(401);
    });

    it('nega o gerenciamento de alertas a passageiros', async () => {
      const listar = await api().get('/api/v1/admin/alertas').set(cabecalho(passageiro.token));
      const criar = await api().post('/api/v1/admin/alertas').set(cabecalho(passageiro.token)).send(alertaBase());

      expect(listar.status).toBe(403);
      expect(criar.status).toBe(403);
    });
  });

  describe('validação na criação', () => {
    it.each([
      ['tipo inválido', { tipo: 'OUTRO' }, 'Tipo de alerta inválido.'],
      ['título vazio', { titulo: '   ' }, 'O título é obrigatório.'],
      ['descrição ausente', { descricao: undefined }, 'A descrição é obrigatória.'],
      ['datas inválidas', { data_inicio: 'ontem' }, 'Datas de início e fim inválidas.'],
      [
        'fim antes do início',
        { data_inicio: isoEmHoras(3), data_fim: isoEmHoras(1) },
        'A data de fim deve ser depois da data de início.',
      ],
      ['linhas fora de uma lista', { linhas: '9001' }, 'As linhas afetadas devem ser uma lista.'],
      ['paradas fora de uma lista', { paradas: '9101' }, 'As paradas afetadas devem ser uma lista.'],
    ])('rejeita %s', async (_descricao, alteracao, mensagem) => {
      const resposta = await criarAlerta(alteracao);

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: mensagem });
    });
  });

  describe('sinalização nas consultas do passageiro', () => {
    let alerta;

    beforeAll(async () => {
      const resposta = await criarAlerta({ titulo: 'Desvio de sinalização' });
      alerta = resposta.body;
    });

    it('marca a linha afetada na busca de linhas e não marca as demais', async () => {
      const resposta = await api().get('/api/v1/linhas').query({ busca: 'Sistema' });
      const porId = Object.fromEntries(resposta.body.map((linha) => [linha.id, linha]));

      expect(resposta.status).toBe(200);
      expect(porId['9001'].afetadaPorAlerta).toBe(true);
      expect(porId['9001'].alertas.map((a) => a.id)).toContain(alerta.id);
      expect(porId['9002'].afetadaPorAlerta).toBe(false);
      expect(porId['9002'].alertas).toEqual([]);
      expect(porId['9003'].afetadaPorAlerta).toBe(false);
    });

    it('marca a linha e apenas a parada afetada no itinerário', async () => {
      const resposta = await api().get('/api/v1/linhas/9001/itinerario');

      expect(resposta.status).toBe(200);
      expect(resposta.body.afetadaPorAlerta).toBe(true);
      expect(resposta.body.itinerario.IDA.map((p) => p.afetadaPorAlerta)).toEqual([true, false, false]);
      expect(resposta.body.itinerario.VOLTA.map((p) => p.afetadaPorAlerta)).toEqual([false, false, true]);
    });

    it('não marca o itinerário de uma linha que não tem relação com o alerta', async () => {
      const resposta = await api().get('/api/v1/linhas/9002/itinerario');

      expect(resposta.status).toBe(200);
      expect(resposta.body.afetadaPorAlerta).toBe(false);
      expect(resposta.body.itinerario.IDA.every((p) => p.afetadaPorAlerta === false)).toBe(true);
    });

    it('marca o quadro de horários da linha afetada', async () => {
      const afetada = await api().get('/api/v1/linhas/9001/horarios');
      const normal = await api().get('/api/v1/linhas/9002/horarios');

      expect(afetada.body.afetadaPorAlerta).toBe(true);
      expect(afetada.body.alertas.map((a) => a.id)).toContain(alerta.id);
      expect(normal.body.afetadaPorAlerta).toBe(false);
    });

    it('marca a parada mais próxima quando ela é afetada', async () => {
      const afetada = await api().get('/api/v1/paradas/proximas').query({ lat: '-15.7942', lng: '-47.8825' });
      const normal = await api().get('/api/v1/paradas/proximas').query({ lat: '-15.8742', lng: '-48.0425' });

      expect(afetada.body).toMatchObject({ id: '9101', afetadaPorAlerta: true });
      expect(normal.body).toMatchObject({ id: '9105', afetadaPorAlerta: false, alertas: [] });
    });

    it('marca as opções de trajeto que passam pela linha ou parada afetada', async () => {
      const afetado = await api()
        .get('/api/v1/trajetos')
        .query({ origem: 'Parada Sistema Alfa', destino: 'Parada Sistema Gama' });
      const normal = await api()
        .get('/api/v1/trajetos')
        .query({ origem: 'Parada Sistema Gama', destino: 'Parada Sistema Epsilon' });

      expect(afetado.status).toBe(200);
      expect(afetado.body.length).toBeGreaterThan(0);
      expect(afetado.body.every((opcao) => opcao.afetadaPorAlerta === true)).toBe(true);
      expect(afetado.body[0].alertas.map((a) => a.id)).toContain(alerta.id);
      expect(normal.body).toHaveLength(1);
      expect(normal.body[0]).toMatchObject({ afetadaPorAlerta: false, alertas: [] });
    });
  });

  describe('ciclo de vida de um alerta', () => {
    let alerta;

    it('cria o alerta ligado à linha e à parada informadas', async () => {
      const resposta = await criarAlerta({
        tipo: 'SUSPENSAO',
        titulo: 'Suspensão temporária',
        descricao: 'Atendimento suspenso no trecho.',
        linhas: ['9002'],
        paradas: ['9104'],
      });

      expect(resposta.status).toBe(201);
      expect(resposta.body).toMatchObject({
        id: expect.any(Number),
        tipo: 'SUSPENSAO',
        titulo: 'Suspensão temporária',
        linhas: ['9002'],
        paradas: ['9104'],
      });
      alerta = resposta.body;
    });

    it('passa a aparecer nos alertas vigentes com as linhas e paradas afetadas', async () => {
      const resposta = await api().get('/api/v1/alertas');
      const encontrado = resposta.body.find((a) => a.id === alerta.id);

      expect(resposta.status).toBe(200);
      expect(encontrado).toMatchObject({
        titulo: 'Suspensão temporária',
        linhas_afetadas: [{ id: '9002', codigo: '0.9002', nome: 'Sistema Beta' }],
        paradas_afetadas: [{ id: '9104', codigo: 'PS9104', nome: 'Parada Sistema Delta' }],
      });
    });

    it('pode ser consultado individualmente', async () => {
      const resposta = await api().get(`/api/v1/alertas/${alerta.id}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({ id: alerta.id, tipo: 'SUSPENSAO' });
    });

    it('responde 404 para alerta vigente que não existe', async () => {
      const resposta = await api().get('/api/v1/alertas/99999999');

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({
        erro: 'NOT_FOUND',
        detalhes: 'Alerta vigente não encontrado para o ID informado.',
      });
    });

    it('filtra os alertas por linha e por parada', async () => {
      expect(await idsVigentes({ linhaId: '9002' })).toContain(alerta.id);
      expect(await idsVigentes({ linhaId: '9001' })).not.toContain(alerta.id);
      expect(await idsVigentes({ paradaId: '9104' })).toContain(alerta.id);
      expect(await idsVigentes({ paradaId: '9105' })).not.toContain(alerta.id);
      expect(await idsVigentes({ linhaId: '9001', paradaId: '9104' })).toContain(alerta.id);
    });

    it('edita o alerta trocando título e itens afetados', async () => {
      const resposta = await api()
        .put(`/api/v1/admin/alertas/${alerta.id}`)
        .set(cabecalho(admin.token))
        .send(alertaBase({ titulo: 'Título editado', linhas: ['9003'], paradas: [] }));

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({ id: alerta.id, titulo: 'Título editado', linhas: ['9003'], paradas: [] });
      expect(await idsVigentes({ linhaId: '9003' })).toContain(alerta.id);
      expect(await idsVigentes({ linhaId: '9002' })).not.toContain(alerta.id);
    });

    it('lista o alerta na área administrativa com os códigos das linhas', async () => {
      const resposta = await listaAdmin();
      const encontrado = resposta.body.find((a) => a.id === alerta.id);

      expect(resposta.status).toBe(200);
      expect(encontrado).toMatchObject({
        titulo: 'Título editado',
        linhas: ['0.9003'],
        linhas_ids: ['9003'],
        paradas: [],
        encerrado_em: null,
      });
    });

    it('não permite excluir um alerta que ainda está em andamento', async () => {
      const resposta = await api().delete(`/api/v1/admin/alertas/${alerta.id}`).set(cabecalho(admin.token));

      expect(resposta.status).toBe(400);
      expect(resposta.body.detalhes).toBe('Encerre o alerta antes de excluí-lo.');
    });

    it('encerra o alerta e ele deixa de ser vigente', async () => {
      const resposta = await api().put(`/api/v1/admin/alertas/${alerta.id}/encerrar`).set(cabecalho(admin.token));
      const consulta = await api().get(`/api/v1/alertas/${alerta.id}`);
      const admins = await listaAdmin();

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ mensagem: 'Alerta encerrado.' });
      expect(consulta.status).toBe(404);
      expect(await idsVigentes()).not.toContain(alerta.id);
      expect(admins.body.find((a) => a.id === alerta.id).encerrado_em).not.toBeNull();
    });

    it('não permite encerrar duas vezes nem editar um alerta encerrado', async () => {
      const encerrarDeNovo = await api().put(`/api/v1/admin/alertas/${alerta.id}/encerrar`).set(cabecalho(admin.token));
      const editar = await api().put(`/api/v1/admin/alertas/${alerta.id}`).set(cabecalho(admin.token)).send(alertaBase());

      expect(encerrarDeNovo.status).toBe(400);
      expect(encerrarDeNovo.body.detalhes).toBe('Este alerta já foi encerrado.');
      expect(editar.status).toBe(400);
      expect(editar.body.detalhes).toBe('Alerta encerrado não pode ser editado.');
    });

    it('exclui o alerta depois de encerrado', async () => {
      const exclusao = await api().delete(`/api/v1/admin/alertas/${alerta.id}`).set(cabecalho(admin.token));
      const admins = await listaAdmin();

      expect(exclusao.status).toBe(200);
      expect(exclusao.body).toEqual({ mensagem: 'Alerta excluído.' });
      expect(admins.body.map((a) => a.id)).not.toContain(alerta.id);
    });

    it('responde 404 ao editar, encerrar ou excluir alerta que não existe', async () => {
      const editar = await api().put('/api/v1/admin/alertas/99999999').set(cabecalho(admin.token)).send(alertaBase());
      const encerrar = await api().put('/api/v1/admin/alertas/99999999/encerrar').set(cabecalho(admin.token));
      const excluir = await api().delete('/api/v1/admin/alertas/99999999').set(cabecalho(admin.token));

      expect([editar.status, encerrar.status, excluir.status]).toEqual([404, 404, 404]);
      expect(excluir.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Alerta não encontrado.' });
    });

    it('rejeita ids que não são números inteiros nas ações administrativas', async () => {
      const editar = await api().put('/api/v1/admin/alertas/abc').set(cabecalho(admin.token)).send(alertaBase());
      const encerrar = await api().put('/api/v1/admin/alertas/abc/encerrar').set(cabecalho(admin.token));
      const excluir = await api().delete('/api/v1/admin/alertas/abc').set(cabecalho(admin.token));

      expect([editar.status, encerrar.status, excluir.status]).toEqual([400, 400, 400]);
      expect(excluir.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'ID inválido.' });
    });
  });

  describe('vigência por data', () => {
    it('não mostra ao passageiro um alerta que ainda não começou, mas o admin enxerga', async () => {
      const criado = await criarAlerta({ titulo: 'Alerta futuro', data_inicio: isoEmHoras(1), data_fim: isoEmHoras(5) });
      const admins = await listaAdmin();

      expect(criado.status).toBe(201);
      expect(await idsVigentes()).not.toContain(criado.body.id);
      expect(admins.body.map((a) => a.id)).toContain(criado.body.id);
    });

    it('não mostra um alerta que já terminou e permite excluí-lo direto', async () => {
      const criado = await criarAlerta({ titulo: 'Alerta passado', data_inicio: isoEmHoras(-5), data_fim: isoEmHoras(-1) });
      const consulta = await api().get(`/api/v1/alertas/${criado.body.id}`);
      const exclusao = await api().delete(`/api/v1/admin/alertas/${criado.body.id}`).set(cabecalho(admin.token));

      expect(criado.status).toBe(201);
      expect(consulta.status).toBe(404);
      expect(exclusao.status).toBe(200);
    });
  });

  describe('busca de paradas para vincular ao alerta', () => {
    it('encontra paradas pelo nome e pelo código', async () => {
      const porNome = await api().get('/api/v1/admin/paradas').query({ busca: 'Sistema Alfa' }).set(cabecalho(admin.token));
      const porCodigo = await api().get('/api/v1/admin/paradas').query({ busca: 'PS9102' }).set(cabecalho(admin.token));

      expect(porNome.status).toBe(200);
      expect(porNome.body).toEqual([{ id: '9101', codigo: 'PS9101', nome: 'Parada Sistema Alfa' }]);
      expect(porCodigo.body).toEqual([{ id: '9102', codigo: 'PS9102', nome: 'Parada Sistema Beta' }]);
    });

    it('devolve lista vazia para buscas com menos de dois caracteres', async () => {
      const resposta = await api().get('/api/v1/admin/paradas').query({ busca: 'S' }).set(cabecalho(admin.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([]);
    });
  });
});
