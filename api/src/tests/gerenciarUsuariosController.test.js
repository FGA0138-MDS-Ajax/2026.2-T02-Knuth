const service = require('../src/services/gerenciarUsuariosService');
const controller = require('../src/controllers/gerenciarUsuariosController');

jest.mock('../src/services/gerenciarUsuariosService', () => ({
  listar: jest.fn(),
  atualizar: jest.fn(),
  excluir: jest.fn(),
}));

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const criarReq = (extra = {}) => ({
  query: {},
  params: { id: '7' },
  body: {},
  usuario: { id: 1, tipo: 'ADMIN' },
  ...extra,
});

// -----testes------
describe('GerenciarUsuariosController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listar', () => {
    it('responde 200 com os usuários devolvidos pelo serviço', async () => {
      const usuarios = [{ id: 1, nome: 'Maria' }, { id: 2, nome: 'João' }];
      service.listar.mockResolvedValue(usuarios);
      const res = criarRes();

      await controller.listar(criarReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(usuarios);
    });

    it('repassa o filtro de tipo da query ao serviço', async () => {
      service.listar.mockResolvedValue([]);

      await controller.listar(criarReq({ query: { tipo: 'ADMIN' } }), criarRes());

      expect(service.listar).toHaveBeenCalledWith('ADMIN');
    });

    it('chama o serviço sem tipo quando a query não tem filtro', async () => {
      service.listar.mockResolvedValue([]);

      await controller.listar(criarReq(), criarRes());

      expect(service.listar).toHaveBeenCalledWith(undefined);
    });
  });

  describe('atualizar', () => {
    it('converte o id para número e repassa corpo e id de quem está logado', async () => {
      const body = { nome: 'Maria Souza', email: 'maria@email.com', tipo: 'ADMIN' };
      service.atualizar.mockResolvedValue({ id: 7, ...body });

      await controller.atualizar(criarReq({ body }), criarRes());

      expect(service.atualizar).toHaveBeenCalledWith(7, body, 1);
    });

    it('responde 200 com o usuário atualizado', async () => {
      const atualizado = { id: 7, nome: 'Maria Souza' };
      service.atualizar.mockResolvedValue(atualizado);
      const res = criarRes();

      await controller.atualizar(criarReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(atualizado);
    });
  });

  describe('excluir', () => {
    it('converte o id para número e repassa o id de quem está logado', async () => {
      service.excluir.mockResolvedValue();

      await controller.excluir(criarReq(), criarRes());

      expect(service.excluir).toHaveBeenCalledWith(7, 1);
    });

    it('responde 200 com a mensagem de confirmação', async () => {
      service.excluir.mockResolvedValue();
      const res = criarRes();

      await controller.excluir(criarReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ mensagem: 'Usuário excluído.' });
    });
  });

  describe.each([['listar'], ['atualizar'], ['excluir']])('erros em %s', (metodo) => {
    it('responde 404 quando o usuário não existe', async () => {
      service[metodo].mockRejectedValue(new Error('Usuário não encontrado.'));
      const res = criarRes();

      await controller[metodo](criarReq(), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'NOT_FOUND',
        detalhes: 'Usuário não encontrado.',
      });
    });

    it('responde 400 com a mensagem do erro nos demais casos', async () => {
      service[metodo].mockRejectedValue(new Error('Você não pode excluir sua própria conta.'));
      const res = criarRes();

      await controller[metodo](criarReq(), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'BAD_REQUEST',
        detalhes: 'Você não pode excluir sua própria conta.',
      });
    });
  });
});
