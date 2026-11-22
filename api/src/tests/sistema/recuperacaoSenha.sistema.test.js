const {
  api,
  pool,
  logar,
  cadastrarPassageiro,
  resetarDados,
  encerrarConexoes,
} = require('./auxiliares');

const MENSAGEM_PADRAO = 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.';

function solicitar(email) {
  return api().post('/api/v1/usuarios/recuperar-senha').send({ email });
}

function redefinir(email, codigo, novaSenha) {
  return api().post('/api/v1/usuarios/redefinir-senha').send({ email, codigo, novaSenha });
}

function codigoErradoPara(codigo) {
  return codigo === '000000' ? '111111' : '000000';
}

let espiaoLog;

beforeAll(async () => {
  espiaoLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  await resetarDados();
});

afterAll(async () => {
  espiaoLog.mockRestore();
  await encerrarConexoes();
});

// -----testes------

describe('Sistema - recuperação de senha', () => {
  describe('solicitação do código', () => {
    it('exige o e-mail', async () => {
      const resposta = await api().post('/api/v1/usuarios/recuperar-senha').send({});

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ erro: 'BAD_REQUEST', detalhes: 'O email é obrigatório.' });
    });

    it('responde do mesmo jeito para e-mail cadastrado e não cadastrado', async () => {
      const { dados } = await cadastrarPassageiro();

      const cadastrado = await solicitar(dados.email);
      const desconhecido = await solicitar('desconhecido@sistema.teste');

      expect(cadastrado.status).toBe(200);
      expect(desconhecido.status).toBe(200);
      expect(cadastrado.body.mensagem).toBe(MENSAGEM_PADRAO);
      expect(desconhecido.body).toEqual({ mensagem: MENSAGEM_PADRAO });
    });

    it('gera um código de seis dígitos e guarda só o hash dele', async () => {
      const { dados, usuario } = await cadastrarPassageiro();

      const resposta = await solicitar(dados.email);
      const { rows } = await pool.query('SELECT codigo_hash, tentativas FROM recuperacoes_senha WHERE usuario_id = $1', [
        usuario.id,
      ]);

      expect(resposta.body.codigoDev).toMatch(/^\d{6}$/);
      expect(rows).toHaveLength(1);
      expect(rows[0].codigo_hash).not.toBe(resposta.body.codigoDev);
      expect(rows[0].tentativas).toBe(0);
    });
  });

  describe('redefinição da senha', () => {
    it('exige e-mail, código e nova senha', async () => {
      const resposta = await api().post('/api/v1/usuarios/redefinir-senha').send({ email: 'a@b.teste' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.detalhes).toBe('Email, código e nova senha são obrigatórios.');
    });

    it('exige nova senha com pelo menos seis caracteres', async () => {
      const resposta = await redefinir('a@b.teste', '123456', '12345');

      expect(resposta.status).toBe(400);
      expect(resposta.body.detalhes).toBe('A nova senha deve ter pelo menos 6 caracteres.');
    });

    it('não revela se o e-mail existe ao redefinir', async () => {
      const resposta = await redefinir('desconhecido@sistema.teste', '123456', 'novasenha1');

      expect(resposta.status).toBe(400);
      expect(resposta.body.detalhes).toBe('Código inválido ou expirado.');
    });

    it('troca a senha com o código correto e invalida o código depois de usado', async () => {
      const { dados } = await cadastrarPassageiro();
      const { body } = await solicitar(dados.email);

      const redefinicao = await redefinir(dados.email, body.codigoDev, 'novasenha1');
      const loginNovo = await logar(dados.email, 'novasenha1');
      const loginAntigo = await logar(dados.email, dados.senha);
      const reuso = await redefinir(dados.email, body.codigoDev, 'outrasenha2');

      expect(redefinicao.status).toBe(200);
      expect(redefinicao.body).toEqual({ mensagem: 'Senha redefinida com sucesso.' });
      expect(loginNovo.status).toBe(200);
      expect(loginAntigo.status).toBe(401);
      expect(reuso.status).toBe(400);
      expect(reuso.body.detalhes).toBe('Código inválido ou expirado.');
    });

    it('conta as tentativas com código errado e mantém a senha antiga', async () => {
      const { dados, usuario } = await cadastrarPassageiro();
      const { body } = await solicitar(dados.email);

      const resposta = await redefinir(dados.email, codigoErradoPara(body.codigoDev), 'novasenha1');
      const { rows } = await pool.query('SELECT tentativas FROM recuperacoes_senha WHERE usuario_id = $1', [usuario.id]);
      const loginAntigo = await logar(dados.email, dados.senha);

      expect(resposta.status).toBe(400);
      expect(resposta.body.detalhes).toBe('Código inválido ou expirado.');
      expect(rows[0].tentativas).toBe(1);
      expect(loginAntigo.status).toBe(200);
    });

    it('bloqueia o código depois de cinco tentativas erradas, mesmo que a sexta esteja certa', async () => {
      const { dados } = await cadastrarPassageiro();
      const { body } = await solicitar(dados.email);
      const errado = codigoErradoPara(body.codigoDev);

      for (let i = 0; i < 5; i += 1) {
        const tentativa = await redefinir(dados.email, errado, 'novasenha1');
        expect(tentativa.status).toBe(400);
      }
      const sexta = await redefinir(dados.email, body.codigoDev, 'novasenha1');
      const seguinte = await redefinir(dados.email, body.codigoDev, 'novasenha1');
      const loginAntigo = await logar(dados.email, dados.senha);

      expect(sexta.status).toBe(400);
      expect(sexta.body.detalhes).toBe('Número máximo de tentativas excedido. Solicite um novo código.');
      expect(seguinte.body.detalhes).toBe('Código inválido ou expirado.');
      expect(loginAntigo.status).toBe(200);
    });

    it('recusa o código depois que ele expira', async () => {
      const { dados, usuario } = await cadastrarPassageiro();
      const { body } = await solicitar(dados.email);
      await pool.query(
        `UPDATE recuperacoes_senha SET expira_em = NOW() - INTERVAL '1 minute' WHERE usuario_id = $1`,
        [usuario.id]
      );

      const resposta = await redefinir(dados.email, body.codigoDev, 'novasenha1');

      expect(resposta.status).toBe(400);
      expect(resposta.body.detalhes).toBe('Código inválido ou expirado.');
    });

    it('invalida o código anterior quando um novo é solicitado', async () => {
      const { dados } = await cadastrarPassageiro();
      const primeiro = await solicitar(dados.email);
      const segundo = await solicitar(dados.email);

      const comPrimeiro = await redefinir(dados.email, primeiro.body.codigoDev, 'novasenha1');
      const comSegundo = await redefinir(dados.email, segundo.body.codigoDev, 'novasenha1');

      expect(comPrimeiro.status).toBe(400);
      expect(comSegundo.status).toBe(200);
    });
  });
});
