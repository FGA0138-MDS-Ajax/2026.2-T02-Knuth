jest.mock('../repositories/gerenciarAlertasRepository');

const repo = require('../repositories/gerenciarAlertasRepository');
const service = require('../services/gerenciarAlertasService');

const dadosValidos = {
  tipo: 'DESVIO',
  titulo: 'Desvio na Epia',
  descricao: 'Linhas desviadas por causa de obras.',
  data_inicio: '2026-11-20T08:00:00Z',
  data_fim: '2026-11-25T18:00:00Z',
  linhas: ['0.782']
};

describe('gerenciarAlertasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criar', () => {
    it('deve exigir um tipo válido', async () => {
      await expect(service.criar({ ...dadosValidos, tipo: 'OUTRO' })).rejects.toThrow('Tipo de alerta inválido.');
      expect(repo.criar).not.toHaveBeenCalled();
    });

    it('deve exigir título', async () => {
      await expect(service.criar({ ...dadosValidos, titulo: '  ' })).rejects.toThrow('O título é obrigatório.');
    });

    it('deve exigir descrição', async () => {
      await expect(service.criar({ ...dadosValidos, descricao: '' })).rejects.toThrow('A descrição é obrigatória.');
    });

    it('deve rejeitar datas inválidas', async () => {
      await expect(service.criar({ ...dadosValidos, data_inicio: 'abc' })).rejects.toThrow('Datas de início e fim inválidas.');
    });

    it('deve exigir que o fim seja depois do início', async () => {
      await expect(
        service.criar({ ...dadosValidos, data_inicio: '2026-11-25T18:00:00Z', data_fim: '2026-11-20T08:00:00Z' })
      ).rejects.toThrow('A data de fim deve ser depois da data de início.');
    });

    it('deve exigir que as linhas sejam uma lista', async () => {
      await expect(service.criar({ ...dadosValidos, linhas: '0.782' })).rejects.toThrow('As linhas afetadas devem ser uma lista.');
    });

    it('deve criar o alerta com dados válidos', async () => {
      repo.criar.mockResolvedValue({ id: 1 });

      const resultado = await service.criar({ ...dadosValidos, titulo: '  Desvio na Epia  ' });

            expect(repo.criar).toHaveBeenCalledWith({
        tipo: 'DESVIO',
        titulo: 'Desvio na Epia',
        descricao: 'Linhas desviadas por causa de obras.',
        dataInicio: '2026-11-20T08:00:00Z',
        dataFim: '2026-11-25T18:00:00Z',
        linhas: ['0.782'],
        paradas: []
      });
      expect(resultado).toEqual({ id: 1 });
    });

    it('deve usar lista vazia quando nenhuma linha for informada', async () => {
      repo.criar.mockResolvedValue({ id: 2 });
      const { linhas, ...semLinhas } = dadosValidos;

      await service.criar(semLinhas);

      expect(repo.criar).toHaveBeenCalledWith(expect.objectContaining({ linhas: [] }));
    });
  });

  describe('listar', () => {
    it('deve retornar todos os alertas', async () => {
      repo.listar.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const resultado = await service.listar();

      expect(resultado).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('encerrar', () => {
    it('deve falhar se o alerta não existir', async () => {
      repo.buscarPorId.mockResolvedValue(null);

      await expect(service.encerrar(99)).rejects.toThrow('Alerta não encontrado.');
      expect(repo.encerrar).not.toHaveBeenCalled();
    });

    it('deve falhar se o alerta já estiver encerrado', async () => {
      repo.buscarPorId.mockResolvedValue({ id: 1, encerrado_em: '2026-11-19T10:00:00Z' });

      await expect(service.encerrar(1)).rejects.toThrow('Este alerta já foi encerrado.');
      expect(repo.encerrar).not.toHaveBeenCalled();
    });

    it('deve encerrar um alerta em andamento', async () => {
      repo.buscarPorId.mockResolvedValue({ id: 1, encerrado_em: null });
      repo.encerrar.mockResolvedValue({ id: 1 });

      const resultado = await service.encerrar(1);

      expect(repo.encerrar).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ id: 1 });
    });
  });
    describe('excluir', () => {
    it('deve falhar se o alerta não existir', async () => {
      repo.buscarPorId.mockResolvedValue(null);

      await expect(service.excluir(99)).rejects.toThrow('Alerta não encontrado.');
      expect(repo.excluir).not.toHaveBeenCalled();
    });

    it('deve impedir excluir alerta ainda em andamento', async () => {
      repo.buscarPorId.mockResolvedValue({ id: 1, encerrado_em: null, data_fim: '2999-01-01T00:00:00Z' });

      await expect(service.excluir(1)).rejects.toThrow('Encerre o alerta antes de excluí-lo.');
      expect(repo.excluir).not.toHaveBeenCalled();
    });

    it('deve excluir alerta encerrado', async () => {
      repo.buscarPorId.mockResolvedValue({ id: 1, encerrado_em: '2026-11-19T10:00:00Z', data_fim: '2026-11-19T10:00:00Z' });
      repo.excluir.mockResolvedValue();

      await service.excluir(1);

      expect(repo.excluir).toHaveBeenCalledWith(1);
    });

    it('deve excluir alerta expirado', async () => {
      repo.buscarPorId.mockResolvedValue({ id: 2, encerrado_em: null, data_fim: '2020-01-01T00:00:00Z' });
      repo.excluir.mockResolvedValue();

      await service.excluir(2);

      expect(repo.excluir).toHaveBeenCalledWith(2);
    });
  });
    describe('paradas afetadas', () => {
    it('deve exigir que as paradas sejam uma lista', async () => {
      await expect(service.criar({ ...dadosValidos, paradas: 'P1' })).rejects.toThrow('As paradas afetadas devem ser uma lista.');
    });

    it('deve repassar as paradas ao criar', async () => {
      repo.criar.mockResolvedValue({ id: 3 });

      await service.criar({ ...dadosValidos, paradas: ['P1', 'P2'] });

      expect(repo.criar).toHaveBeenCalledWith(expect.objectContaining({ paradas: ['P1', 'P2'] }));
    });
  });

  describe('editar', () => {
    it('deve falhar se o alerta não existir', async () => {
      repo.buscarPorId.mockResolvedValue(null);

      await expect(service.editar(99, dadosValidos)).rejects.toThrow('Alerta não encontrado.');
      expect(repo.atualizar).not.toHaveBeenCalled();
    });

    it('deve impedir editar um alerta encerrado', async () => {
      repo.buscarPorId.mockResolvedValue({ id: 1, encerrado_em: '2026-11-19T10:00:00Z' });

      await expect(service.editar(1, dadosValidos)).rejects.toThrow('Alerta encerrado não pode ser editado.');
      expect(repo.atualizar).not.toHaveBeenCalled();
    });

    it('deve validar os dados como na criação', async () => {
      repo.buscarPorId.mockResolvedValue({ id: 1, encerrado_em: null });

      await expect(service.editar(1, { ...dadosValidos, tipo: 'OUTRO' })).rejects.toThrow('Tipo de alerta inválido.');
      expect(repo.atualizar).not.toHaveBeenCalled();
    });

    it('deve atualizar o alerta com dados válidos', async () => {
      repo.buscarPorId.mockResolvedValue({ id: 1, encerrado_em: null });
      repo.atualizar.mockResolvedValue({ id: 1 });

      const resultado = await service.editar(1, { ...dadosValidos, paradas: ['P1'] });

      expect(repo.atualizar).toHaveBeenCalledWith(1, {
        tipo: 'DESVIO',
        titulo: 'Desvio na Epia',
        descricao: 'Linhas desviadas por causa de obras.',
        dataInicio: '2026-11-20T08:00:00Z',
        dataFim: '2026-11-25T18:00:00Z',
        linhas: ['0.782'],
        paradas: ['P1']
      });
      expect(resultado).toEqual({ id: 1 });
    });
  });
    describe('buscarParadas', () => {
    it('deve devolver lista vazia quando a busca for curta', async () => {
      const resultado = await service.buscarParadas('a');

      expect(resultado).toEqual([]);
      expect(repo.buscarParadas).not.toHaveBeenCalled();
    });

    it('deve buscar as paradas pelo texto sem espaços nas pontas', async () => {
      repo.buscarParadas.mockResolvedValue([{ id: 'P1', nome: 'Asa Sul' }]);

      const resultado = await service.buscarParadas('  asa  ');

      expect(repo.buscarParadas).toHaveBeenCalledWith('asa');
      expect(resultado).toEqual([{ id: 'P1', nome: 'Asa Sul' }]);
    });
  });
});