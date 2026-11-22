const jwt = require('jsonwebtoken');
const {
  api,
  pool,
  cabecalho,
  cadastrarPassageiro,
  logar,
  criarPassageiroLogado,
  criarAdminLogado,
  resetarDados,
  encerrarConexoes,
} = require('./auxiliares');

beforeAll(resetarDados);
afterAll(encerrarConexoes);

// -----testes------

describe('Sistema - jornada do passageiro', () => {
  describe('cadastro e login', () => {
    it('cadastra um passageiro sem devolver dados sensíveis', async () => {
      const { dados, resposta } = await cadastrarPassageiro();

      expect(resposta.status).toBe(201);
      expect(resposta.body).toEqual({
        id: expect.any(Number),
        nome: dados.nome,
        email: dados.email,
        tipo: 'PASSAGEIRO',
      });
    });

    it('não permite cadastrar o mesmo e-mail duas vezes', async () => {
      const { dados } = await cadastrarPassageiro();

      const repetido = await api().post('/api/v1/usuarios/cadastro').send(dados);

      expect(repetido.status).toBe(400);
      expect(repetido.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'Este email já está cadastrado.' });
    });

    it('exige nome, e-mail e senha no cadastro', async () => {
      const resposta = await api().post('/api/v1/usuarios/cadastro').send({ nome: 'Sem senha', email: 'sem@senha.teste' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.detalhes).toBe('Nome, email e senha são obrigatórios.');
    });

    it('faz login e devolve um token JWT com id e tipo do usuário', async () => {
      const { dados, usuario } = await cadastrarPassageiro();

      const login = await logar(dados.email, dados.senha);

      expect(login.status).toBe(200);
      expect(login.body.usuario).toEqual({ id: usuario.id, nome: dados.nome, email: dados.email, tipo: 'PASSAGEIRO' });
      expect(jwt.verify(login.body.token, process.env.JWT_SECRET)).toMatchObject({ id: usuario.id, tipo: 'PASSAGEIRO' });
    });

    it('rejeita senha errada e e-mail inexistente com a mesma mensagem', async () => {
      const { dados } = await cadastrarPassageiro();

      const senhaErrada = await logar(dados.email, 'senha-errada');
      const emailInexistente = await logar('ninguem@sistema.teste', dados.senha);

      expect(senhaErrada.status).toBe(401);
      expect(emailInexistente.status).toBe(401);
      expect(senhaErrada.body).toEqual({ erro: 'UNAUTHORIZED', detalhes: 'Email ou senha incorretos.' });
      expect(emailInexistente.body).toEqual(senhaErrada.body);
    });
  });

  describe('favoritos', () => {
    let passageiro;
    let outro;
    const ids = {};

    beforeAll(async () => {
      passageiro = await criarPassageiroLogado();
      outro = await criarPassageiroLogado();
    });

    it('exige token para acessar os favoritos', async () => {
      const resposta = await api().get('/api/v1/favoritos');

      expect(resposta.status).toBe(401);
      expect(resposta.body).toEqual({ erro: 'UNAUTHORIZED', detalhes: 'Token não informado.' });
    });

    it('rejeita token inválido', async () => {
      const resposta = await api().get('/api/v1/favoritos').set('Authorization', 'Bearer token-invalido');

      expect(resposta.status).toBe(401);
      expect(resposta.body).toEqual({ erro: 'UNAUTHORIZED', detalhes: 'Token inválido ou expirado.' });
    });

    it('começa com a lista de favoritos vazia', async () => {
      const resposta = await api().get('/api/v1/favoritos').set(cabecalho(passageiro.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([]);
    });

    it('favorita uma linha e devolve os dados dela', async () => {
      const resposta = await api()
        .post('/api/v1/favoritos')
        .set(cabecalho(passageiro.token))
        .send({ tipo: 'LINHA', linhaId: '9001' });

      expect(resposta.status).toBe(201);
      expect(resposta.body).toMatchObject({
        id: expect.any(Number),
        tipo: 'LINHA',
        linhaId: '9001',
        linhaCodigo: '0.9001',
        linhaNome: 'Sistema Alfa',
        linhaCor: '#FF0000',
      });
      ids.linha = resposta.body.id;
    });

    it('favorita uma parada e devolve os dados dela', async () => {
      const resposta = await api()
        .post('/api/v1/favoritos')
        .set(cabecalho(passageiro.token))
        .send({ tipo: 'PARADA', paradaId: '9101' });

      expect(resposta.status).toBe(201);
      expect(resposta.body).toMatchObject({
        tipo: 'PARADA',
        paradaId: '9101',
        paradaCodigo: 'PS9101',
        paradaNome: 'Parada Sistema Alfa',
      });
      ids.parada = resposta.body.id;
    });

    it('favorita um trajeto normalizando o tipo para maiúsculas', async () => {
      const resposta = await api()
        .post('/api/v1/favoritos')
        .set(cabecalho(passageiro.token))
        .send({ tipo: 'trajeto', origem: 'Parada Sistema Alfa', destino: 'Parada Sistema Gama' });

      expect(resposta.status).toBe(201);
      expect(resposta.body).toMatchObject({
        tipo: 'TRAJETO',
        origem: 'Parada Sistema Alfa',
        destino: 'Parada Sistema Gama',
      });
      ids.trajeto = resposta.body.id;
    });

    it('não duplica favoritos', async () => {
      const linha = await api()
        .post('/api/v1/favoritos')
        .set(cabecalho(passageiro.token))
        .send({ tipo: 'LINHA', linhaId: '9001' });
      const trajeto = await api()
        .post('/api/v1/favoritos')
        .set(cabecalho(passageiro.token))
        .send({ tipo: 'TRAJETO', origem: 'Parada Sistema Alfa', destino: 'Parada Sistema Gama' });

      expect(linha.status).toBe(409);
      expect(linha.body).toEqual({ erro: 'CONFLICT', detalhes: 'Este item já está nos favoritos.' });
      expect(trajeto.status).toBe(409);
    });

    it('valida os dados do favorito', async () => {
      const tipoInvalido = await api().post('/api/v1/favoritos').set(cabecalho(passageiro.token)).send({ tipo: 'ONIBUS' });
      const semLinha = await api().post('/api/v1/favoritos').set(cabecalho(passageiro.token)).send({ tipo: 'LINHA' });
      const semDestino = await api()
        .post('/api/v1/favoritos')
        .set(cabecalho(passageiro.token))
        .send({ tipo: 'TRAJETO', origem: 'Parada Sistema Alfa' });

      expect(tipoInvalido.status).toBe(400);
      expect(tipoInvalido.body.detalhes).toBe('Tipo de favorito inválido.');
      expect(semLinha.status).toBe(400);
      expect(semLinha.body.detalhes).toBe('Informe a linha do favorito.');
      expect(semDestino.status).toBe(400);
      expect(semDestino.body.detalhes).toBe('Informe origem e destino do trajeto.');
    });

    it('responde 404 ao favoritar linha ou parada que não existem', async () => {
      const linha = await api()
        .post('/api/v1/favoritos')
        .set(cabecalho(passageiro.token))
        .send({ tipo: 'LINHA', linhaId: '123456' });
      const parada = await api()
        .post('/api/v1/favoritos')
        .set(cabecalho(passageiro.token))
        .send({ tipo: 'PARADA', paradaId: '123456' });

      expect(linha.status).toBe(404);
      expect(linha.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Linha ou parada não encontrada.' });
      expect(parada.status).toBe(404);
    });

    it('lista os três favoritos criados', async () => {
      const resposta = await api().get('/api/v1/favoritos').set(cabecalho(passageiro.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body.map((f) => f.tipo).sort()).toEqual(['LINHA', 'PARADA', 'TRAJETO']);
    });

    it('isola os favoritos de cada passageiro', async () => {
      const lista = await api().get('/api/v1/favoritos').set(cabecalho(outro.token));
      const remocao = await api().delete(`/api/v1/favoritos/${ids.parada}`).set(cabecalho(outro.token));
      const aindaExiste = await api().get('/api/v1/favoritos').set(cabecalho(passageiro.token));

      expect(lista.body).toEqual([]);
      expect(remocao.status).toBe(404);
      expect(aindaExiste.body.map((f) => f.id)).toContain(ids.parada);
    });

    it('remove um favorito e não deixa remover de novo', async () => {
      const remocao = await api().delete(`/api/v1/favoritos/${ids.linha}`).set(cabecalho(passageiro.token));
      const repetida = await api().delete(`/api/v1/favoritos/${ids.linha}`).set(cabecalho(passageiro.token));
      const lista = await api().get('/api/v1/favoritos').set(cabecalho(passageiro.token));

      expect(remocao.status).toBe(200);
      expect(remocao.body).toEqual({ mensagem: 'Favorito removido.' });
      expect(repetida.status).toBe(404);
      expect(repetida.body.detalhes).toBe('Favorito não encontrado.');
      expect(lista.body).toHaveLength(2);
    });

    it('rejeita ids inválidos na remoção', async () => {
      const texto = await api().delete('/api/v1/favoritos/abc').set(cabecalho(passageiro.token));
      const zero = await api().delete('/api/v1/favoritos/0').set(cabecalho(passageiro.token));

      expect(texto.status).toBe(400);
      expect(texto.body.detalhes).toBe('ID inválido.');
      expect(zero.status).toBe(400);
    });

    it('bloqueia o uso de favoritos por administradores', async () => {
      const admin = await criarAdminLogado();

      const resposta = await api().get('/api/v1/favoritos').set(cabecalho(admin.token));

      expect(resposta.status).toBe(403);
      expect(resposta.body).toEqual({
        erro: 'FORBIDDEN',
        detalhes: 'Apenas passageiros cadastrados podem usar favoritos.',
      });
    });
  });

  describe('buscas recentes', () => {
    let passageiro;

    beforeAll(async () => {
      passageiro = await criarPassageiroLogado();
    });

    it('registra a busca removendo espaços extras e associando ao usuário', async () => {
      const resposta = await api()
        .post('/api/v1/buscas-recentes')
        .send({ origem: '  Parada Sistema Alfa ', destino: ' Parada Sistema Gama  ', usuarioId: passageiro.usuario.id });

      expect(resposta.status).toBe(201);
      expect(resposta.body).toMatchObject({
        origem: 'Parada Sistema Alfa',
        destino: 'Parada Sistema Gama',
        usuario_id: passageiro.usuario.id,
      });
    });

    it('exige origem e destino', async () => {
      const resposta = await api().post('/api/v1/buscas-recentes').send({ origem: 'Parada Sistema Alfa' });

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'Origem e destino são obrigatórios.' });
    });

    it('lista da mais recente para a mais antiga e respeita o limite', async () => {
      await api()
        .post('/api/v1/buscas-recentes')
        .send({ origem: 'Parada Sistema Beta', destino: 'Parada Sistema Delta', usuarioId: passageiro.usuario.id });

      const limitada = await api()
        .get('/api/v1/buscas-recentes')
        .query({ usuarioId: passageiro.usuario.id, limite: 1 });
      const todas = await api().get('/api/v1/buscas-recentes').query({ usuarioId: passageiro.usuario.id });

      expect(limitada.status).toBe(200);
      expect(limitada.body).toHaveLength(1);
      expect(limitada.body[0]).toMatchObject({ origem: 'Parada Sistema Beta', destino: 'Parada Sistema Delta' });
      expect(todas.body).toHaveLength(2);
    });
  });

  describe('exclusão da própria conta', () => {
    it('exige token', async () => {
      const resposta = await api().delete('/api/v1/usuarios/me').send({ senha: 'qualquer' });

      expect(resposta.status).toBe(401);
    });

    it('exige a senha para confirmar', async () => {
      const passageiro = await criarPassageiroLogado();

      const resposta = await api().delete('/api/v1/usuarios/me').set(cabecalho(passageiro.token));

      expect(resposta.status).toBe(400);
      expect(resposta.body.detalhes).toBe('Informe sua senha para confirmar a exclusão.');
    });

    it('recusa a exclusão com senha incorreta e mantém a conta', async () => {
      const passageiro = await criarPassageiroLogado();

      const resposta = await api()
        .delete('/api/v1/usuarios/me')
        .set(cabecalho(passageiro.token))
        .send({ senha: 'senha-errada' });
      const login = await logar(passageiro.dados.email, passageiro.dados.senha);

      expect(resposta.status).toBe(401);
      expect(resposta.body.detalhes).toBe('Senha incorreta.');
      expect(login.status).toBe(200);
    });

    it('não permite que administradores excluam a própria conta por este caminho', async () => {
      const admin = await criarAdminLogado();

      const resposta = await api()
        .delete('/api/v1/usuarios/me')
        .set(cabecalho(admin.token))
        .send({ senha: admin.dados.senha });

      expect(resposta.status).toBe(403);
      expect(resposta.body.detalhes).toBe('A exclusão da própria conta está disponível apenas para passageiros.');
    });

    it('exclui a conta e apaga favoritos e buscas recentes do usuário', async () => {
      const passageiro = await criarPassageiroLogado();
      await api()
        .post('/api/v1/favoritos')
        .set(cabecalho(passageiro.token))
        .send({ tipo: 'LINHA', linhaId: '9002' });
      await api()
        .post('/api/v1/buscas-recentes')
        .send({ origem: 'Parada Sistema Alfa', destino: 'Parada Sistema Gama', usuarioId: passageiro.usuario.id });

      const exclusao = await api()
        .delete('/api/v1/usuarios/me')
        .set(cabecalho(passageiro.token))
        .send({ senha: passageiro.dados.senha });
      const loginDepois = await logar(passageiro.dados.email, passageiro.dados.senha);
      const restantes = await pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM usuarios WHERE id = $1) AS usuarios,
           (SELECT COUNT(*)::int FROM favoritos WHERE usuario_id = $1) AS favoritos,
           (SELECT COUNT(*)::int FROM buscas_recentes WHERE usuario_id = $1) AS buscas`,
        [passageiro.usuario.id]
      );

      expect(exclusao.status).toBe(200);
      expect(exclusao.body).toEqual({ mensagem: 'Conta excluída com sucesso.' });
      expect(loginDepois.status).toBe(401);
      expect(restantes.rows[0]).toEqual({ usuarios: 0, favoritos: 0, buscas: 0 });
    });
  });
});
