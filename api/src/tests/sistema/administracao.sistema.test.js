const {
  api,
  pool,
  cabecalho,
  emailUnico,
  logar,
  criarPassageiroLogado,
  criarAdminLogado,
  resetarDados,
  encerrarConexoes,
} = require('./auxiliares');

let admin;
let passageiro;

beforeAll(async () => {
  await resetarDados();
  admin = await criarAdminLogado();
  passageiro = await criarPassageiroLogado();
});

afterAll(encerrarConexoes);

// -----testes------

describe('Sistema - administração de usuários', () => {
  describe('controle de acesso', () => {
    it('exige token nas rotas administrativas', async () => {
      const resposta = await api().get('/api/v1/admin/perfil');

      expect(resposta.status).toBe(401);
      expect(resposta.body).toEqual({ erro: 'UNAUTHORIZED', detalhes: 'Token não informado.' });
    });

    it('nega acesso a passageiros', async () => {
      const resposta = await api().get('/api/v1/admin/perfil').set(cabecalho(passageiro.token));

      expect(resposta.status).toBe(403);
      expect(resposta.body).toEqual({ erro: 'FORBIDDEN', detalhes: 'Acesso restrito ao administrador.' });
    });

    it('libera o perfil para administradores', async () => {
      const resposta = await api().get('/api/v1/admin/perfil').set(cabecalho(admin.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({
        mensagem: 'Acesso de administrador liberado.',
        usuario: { id: admin.usuario.id, tipo: 'ADMIN' },
      });
    });

    it('nega a passageiros todas as operações de gerenciamento de usuários', async () => {
      const listar = await api().get('/api/v1/admin/usuarios').set(cabecalho(passageiro.token));
      const criar = await api().post('/api/v1/admin/usuarios').set(cabecalho(passageiro.token)).send({});
      const atualizar = await api().put('/api/v1/admin/usuarios/1').set(cabecalho(passageiro.token)).send({});
      const excluir = await api().delete('/api/v1/admin/usuarios/1').set(cabecalho(passageiro.token));

      expect([listar.status, criar.status, atualizar.status, excluir.status]).toEqual([403, 403, 403, 403]);
    });
  });

  describe('criação de administradores', () => {
    it('cria um novo administrador que consegue entrar e acessar a área restrita', async () => {
      const email = emailUnico('novo-admin');

      const criacao = await api()
        .post('/api/v1/admin/usuarios')
        .set(cabecalho(admin.token))
        .send({ nome: 'Novo Admin', email, senha: 'segredo123' });
      const login = await logar(email, 'segredo123');
      const perfil = await api().get('/api/v1/admin/perfil').set(cabecalho(login.body.token));

      expect(criacao.status).toBe(201);
      expect(criacao.body).toEqual({ id: expect.any(Number), nome: 'Novo Admin', email, tipo: 'ADMIN' });
      expect(login.status).toBe(200);
      expect(perfil.status).toBe(200);
    });

    it('valida os dados do novo administrador', async () => {
      const email = emailUnico('duplicado');
      await api().post('/api/v1/admin/usuarios').set(cabecalho(admin.token)).send({ nome: 'Dup', email, senha: 'segredo123' });

      const semCampos = await api().post('/api/v1/admin/usuarios').set(cabecalho(admin.token)).send({ nome: 'Sem email' });
      const senhaCurta = await api()
        .post('/api/v1/admin/usuarios')
        .set(cabecalho(admin.token))
        .send({ nome: 'Curta', email: emailUnico('curta'), senha: '123' });
      const repetido = await api().post('/api/v1/admin/usuarios').set(cabecalho(admin.token)).send({ nome: 'Dup', email, senha: 'segredo123' });

      expect(semCampos.status).toBe(400);
      expect(semCampos.body.detalhes).toBe('Nome, email e senha são obrigatórios.');
      expect(senhaCurta.status).toBe(400);
      expect(senhaCurta.body.detalhes).toBe('A senha deve ter pelo menos 6 caracteres.');
      expect(repetido.status).toBe(400);
      expect(repetido.body.detalhes).toBe('Este email já está cadastrado.');
    });
  });

  describe('listagem', () => {
    it('lista todos os usuários sem expor o hash da senha', async () => {
      const resposta = await api().get('/api/v1/admin/usuarios').set(cabecalho(admin.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body.map((u) => u.id)).toEqual(expect.arrayContaining([admin.usuario.id, passageiro.usuario.id]));
      resposta.body.forEach((usuario) => {
        expect(usuario).not.toHaveProperty('senha_hash');
      });
    });

    it('filtra por tipo', async () => {
      const resposta = await api().get('/api/v1/admin/usuarios').query({ tipo: 'PASSAGEIRO' }).set(cabecalho(admin.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body.length).toBeGreaterThan(0);
      expect(resposta.body.every((u) => u.tipo === 'PASSAGEIRO')).toBe(true);
      expect(resposta.body.map((u) => u.id)).toContain(passageiro.usuario.id);
    });
  });

  describe('atualização', () => {
    it('atualiza o nome de um passageiro', async () => {
      const alvo = await criarPassageiroLogado();

      const resposta = await api()
        .put(`/api/v1/admin/usuarios/${alvo.usuario.id}`)
        .set(cabecalho(admin.token))
        .send({ nome: 'Nome Atualizado', email: alvo.dados.email });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({
        id: alvo.usuario.id,
        nome: 'Nome Atualizado',
        email: alvo.dados.email,
        tipo: 'PASSAGEIRO',
      });
    });

    it('troca a senha do usuário e a nova senha passa a valer no login', async () => {
      const alvo = await criarPassageiroLogado();

      const atualizacao = await api()
        .put(`/api/v1/admin/usuarios/${alvo.usuario.id}`)
        .set(cabecalho(admin.token))
        .send({ nome: alvo.dados.nome, email: alvo.dados.email, senha: 'senhanova99' });
      const loginNovo = await logar(alvo.dados.email, 'senhanova99');
      const loginAntigo = await logar(alvo.dados.email, alvo.dados.senha);

      expect(atualizacao.status).toBe(200);
      expect(loginNovo.status).toBe(200);
      expect(loginAntigo.status).toBe(401);
    });

    it('promove um passageiro a administrador', async () => {
      const alvo = await criarPassageiroLogado();

      const promocao = await api()
        .put(`/api/v1/admin/usuarios/${alvo.usuario.id}`)
        .set(cabecalho(admin.token))
        .send({ nome: alvo.dados.nome, email: alvo.dados.email, tipo: 'ADMIN' });
      const novoLogin = await logar(alvo.dados.email, alvo.dados.senha);
      const perfil = await api().get('/api/v1/admin/perfil').set(cabecalho(novoLogin.body.token));

      expect(promocao.status).toBe(200);
      expect(promocao.body.tipo).toBe('ADMIN');
      expect(perfil.status).toBe(200);
    });

    it('valida os dados da atualização', async () => {
      const alvo = await criarPassageiroLogado();
      const outro = await criarPassageiroLogado();
      const url = `/api/v1/admin/usuarios/${alvo.usuario.id}`;

      const semNome = await api().put(url).set(cabecalho(admin.token)).send({ email: alvo.dados.email });
      const tipoInvalido = await api().put(url).set(cabecalho(admin.token)).send({ nome: 'X', email: alvo.dados.email, tipo: 'CHEFE' });
      const senhaCurta = await api().put(url).set(cabecalho(admin.token)).send({ nome: 'X', email: alvo.dados.email, senha: '123' });
      const emailEmUso = await api().put(url).set(cabecalho(admin.token)).send({ nome: 'X', email: outro.dados.email });
      const inexistente = await api().put('/api/v1/admin/usuarios/999999').set(cabecalho(admin.token)).send({ nome: 'X', email: 'x@y.teste' });

      expect(semNome.body.detalhes).toBe('Nome e email são obrigatórios.');
      expect(tipoInvalido.body.detalhes).toBe('Tipo inválido.');
      expect(senhaCurta.body.detalhes).toBe('A senha deve ter pelo menos 6 caracteres.');
      expect(emailEmUso.body.detalhes).toBe('Este email já está cadastrado.');
      expect([semNome.status, tipoInvalido.status, senhaCurta.status, emailEmUso.status]).toEqual([400, 400, 400, 400]);
      expect(inexistente.status).toBe(404);
      expect(inexistente.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Usuário não encontrado.' });
    });

    it('impede o administrador de rebaixar a si mesmo', async () => {
      const resposta = await api()
        .put(`/api/v1/admin/usuarios/${admin.usuario.id}`)
        .set(cabecalho(admin.token))
        .send({ nome: admin.dados.nome, email: admin.dados.email, tipo: 'PASSAGEIRO' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.detalhes).toBe('Você não pode rebaixar a si mesma.');
    });
  });

  describe('exclusão', () => {
    it('exclui um passageiro e ele some da listagem', async () => {
      const alvo = await criarPassageiroLogado();

      const exclusao = await api().delete(`/api/v1/admin/usuarios/${alvo.usuario.id}`).set(cabecalho(admin.token));
      const listagem = await api().get('/api/v1/admin/usuarios').set(cabecalho(admin.token));
      const login = await logar(alvo.dados.email, alvo.dados.senha);

      expect(exclusao.status).toBe(200);
      expect(exclusao.body).toEqual({ mensagem: 'Usuário excluído.' });
      expect(listagem.body.map((u) => u.id)).not.toContain(alvo.usuario.id);
      expect(login.status).toBe(401);
    });

    it('exclui outro administrador quando existe mais de um', async () => {
      const outroAdmin = await criarAdminLogado();

      const exclusao = await api().delete(`/api/v1/admin/usuarios/${outroAdmin.usuario.id}`).set(cabecalho(admin.token));
      const { rows } = await pool.query('SELECT id FROM usuarios WHERE id = $1', [outroAdmin.usuario.id]);

      expect(exclusao.status).toBe(200);
      expect(rows).toHaveLength(0);
    });

    it('não deixa o administrador excluir a própria conta', async () => {
      const resposta = await api().delete(`/api/v1/admin/usuarios/${admin.usuario.id}`).set(cabecalho(admin.token));

      expect(resposta.status).toBe(400);
      expect(resposta.body.detalhes).toBe('Você não pode excluir a própria conta.');
    });

    it('responde 404 ao excluir usuário que não existe', async () => {
      const resposta = await api().delete('/api/v1/admin/usuarios/999999').set(cabecalho(admin.token));

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({ erro: 'NOT_FOUND', detalhes: 'Usuário não encontrado.' });
    });
  });
});
