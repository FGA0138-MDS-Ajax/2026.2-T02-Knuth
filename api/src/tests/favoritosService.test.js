const repository = require('../repositories/favoritosRepository');
const service = require('../services/favoritosService');

jest.mock('../repositories/favoritosRepository', () => ({
  listar: jest.fn(),
  adicionar: jest.fn(),
  remover: jest.fn(),
}));

describe('favoritosService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listar', () => {
    it('devolve os favoritos do usuário', async () => {
      const favoritos = [{ id: 1, tipo: 'LINHA' }];
      repository.listar.mockResolvedValue(favoritos);

      const resultado = await service.listar(3);

      expect(repository.listar).toHaveBeenCalledWith(3);
      expect(resultado).toEqual(favoritos);
    });
  });

  describe('adicionar', () => {
    it('deve rejeitar um tipo inválido', async () => {
      await expect(service.adicionar(3, { tipo: 'ONIBUS' })).rejects.toMatchObject({
        message: 'Tipo de favorito inválido.',
        status: 400,
      });
      expect(repository.adicionar).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando o tipo não for informado', async () => {
      await expect(service.adicionar(3, {})).rejects.toMatchObject({
        message: 'Tipo de favorito inválido.',
        status: 400,
      });
    });

    it('deve exigir a linha em um favorito de linha', async () => {
      await expect(service.adicionar(3, { tipo: 'LINHA' })).rejects.toMatchObject({
        message: 'Informe a linha do favorito.',
        status: 400,
      });
    });

    it('deve exigir a parada em um favorito de parada', async () => {
      await expect(service.adicionar(3, { tipo: 'PARADA', paradaId: '  ' })).rejects.toMatchObject({
        message: 'Informe a parada do favorito.',
        status: 400,
      });
    });

    it('deve exigir origem e destino em um favorito de trajeto', async () => {
      await expect(service.adicionar(3, { tipo: 'TRAJETO', origem: 'Asa Sul' })).rejects.toMatchObject({
        message: 'Informe origem e destino do trajeto.',
        status: 400,
      });
      await expect(service.adicionar(3, { tipo: 'TRAJETO', destino: 'Rodoviária' })).rejects.toMatchObject({
        message: 'Informe origem e destino do trajeto.',
        status: 400,
      });
    });

    it('deve salvar um favorito de linha', async () => {
      const criado = { id: 7, tipo: 'LINHA', linhaId: '0.111-1' };
      repository.adicionar.mockResolvedValue(criado);

      const resultado = await service.adicionar(3, { tipo: 'LINHA', linhaId: '0.111-1' });

      expect(repository.adicionar).toHaveBeenCalledWith({
        usuarioId: 3,
        tipo: 'LINHA',
        linhaId: '0.111-1',
      });
      expect(resultado).toEqual(criado);
    });

    it('deve salvar um favorito de parada', async () => {
      repository.adicionar.mockResolvedValue({ id: 8 });

      await service.adicionar(3, { tipo: 'PARADA', paradaId: 'P1' });

      expect(repository.adicionar).toHaveBeenCalledWith({
        usuarioId: 3,
        tipo: 'PARADA',
        paradaId: 'P1',
      });
    });

    it('deve salvar um favorito de trajeto sem espaços nas pontas', async () => {
      repository.adicionar.mockResolvedValue({ id: 9 });

      await service.adicionar(3, { tipo: 'TRAJETO', origem: ' Asa Sul ', destino: ' Rodoviária ' });

      expect(repository.adicionar).toHaveBeenCalledWith({
        usuarioId: 3,
        tipo: 'TRAJETO',
        origem: 'Asa Sul',
        destino: 'Rodoviária',
      });
    });

    it('deve aceitar o tipo em minúsculas', async () => {
      repository.adicionar.mockResolvedValue({ id: 10 });

      await service.adicionar(3, { tipo: 'linha', linhaId: '0.111-1' });

      expect(repository.adicionar.mock.calls[0][0].tipo).toBe('LINHA');
    });

    it('deve ignorar campos que não pertencem ao tipo', async () => {
      repository.adicionar.mockResolvedValue({ id: 11 });

      await service.adicionar(3, { tipo: 'LINHA', linhaId: '0.111-1', paradaId: 'P1', origem: 'A' });

      expect(repository.adicionar).toHaveBeenCalledWith({
        usuarioId: 3,
        tipo: 'LINHA',
        linhaId: '0.111-1',
      });
    });

    it('deve responder 409 quando o item já estiver nos favoritos', async () => {
      repository.adicionar.mockResolvedValue(null);

      await expect(service.adicionar(3, { tipo: 'LINHA', linhaId: '0.111-1' })).rejects.toMatchObject({
        message: 'Este item já está nos favoritos.',
        status: 409,
      });
    });

    it('deve responder 404 quando a linha ou a parada não existir', async () => {
      repository.adicionar.mockRejectedValue({ code: '23503' });

      await expect(service.adicionar(3, { tipo: 'LINHA', linhaId: 'inexistente' })).rejects.toMatchObject({
        message: 'Linha ou parada não encontrada.',
        status: 404,
      });
    });

    it('deve propagar os outros erros do banco', async () => {
      repository.adicionar.mockRejectedValue(new Error('falha no banco'));

      await expect(service.adicionar(3, { tipo: 'LINHA', linhaId: '0.111-1' })).rejects.toThrow('falha no banco');
    });
  });

  describe('remover', () => {
    it('deve rejeitar um id que não seja número positivo', async () => {
      for (const id of ['abc', 0, -1, '1.5', undefined]) {
        await expect(service.remover(3, id)).rejects.toMatchObject({
          message: 'ID inválido.',
          status: 400,
        });
      }
      expect(repository.remover).not.toHaveBeenCalled();
    });

    it('deve responder 404 quando o favorito não existir ou não for do usuário', async () => {
      repository.remover.mockResolvedValue(false);

      await expect(service.remover(3, 99)).rejects.toMatchObject({
        message: 'Favorito não encontrado.',
        status: 404,
      });
    });

    it('deve remover o favorito do usuário', async () => {
      repository.remover.mockResolvedValue(true);

      await service.remover(3, '7');

      expect(repository.remover).toHaveBeenCalledWith(7, 3);
    });
  });
});