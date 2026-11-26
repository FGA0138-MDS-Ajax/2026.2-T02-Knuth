const pool = require('../config/database');
const repository = require('../repositories/linhasRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

// -----testes------
describe('LinhasRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('findLinhas', () => {
    it('lista todas as linhas quando não há filtro', async () => {
      const linhas = [{ id: 1, codigo: '0.111' }];
      pool.query.mockResolvedValue({ rows: linhas });

      const resultado = await repository.findLinhas();

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM linhas WHERE 1=1');
      expect(sql).not.toContain('ILIKE');
      expect(params).toEqual([]);
      expect(resultado).toEqual(linhas);
    });

    it('busca por código ou nome quando o filtro é um texto', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.findLinhas('asa');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('codigo ILIKE $1 OR nome ILIKE $1');
      expect(params).toEqual(['%asa%']);
    });

    it('busca por código ou nome quando o filtro é um objeto com busca', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.findLinhas({ busca: 'asa' });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('codigo ILIKE $1 OR nome ILIKE $1');
      expect(params).toEqual(['%asa%']);
    });

    it('não filtra quando a busca é um texto vazio', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.findLinhas('');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).not.toContain('ILIKE');
      expect(params).toEqual([]);
    });

    it('não aplica filtros diferentes de busca', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repository.findLinhas({ bacia: 'Paranoá', regiao: 'Norte', tipo: 'CONVENCIONAL' });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).not.toContain('ILIKE');
      expect(params).toEqual([]);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.findLinhas('asa')).rejects.toThrow('falha no banco');
    });
  });

  describe('findItinerarioByLinhaId', () => {
    it('consulta o itinerário pelo id da linha e devolve todas as linhas', async () => {
      const paradas = [{ sentido: 'IDA', sequencia: 1 }, { sentido: 'IDA', sequencia: 2 }];
      pool.query.mockResolvedValue({ rows: paradas });

      const resultado = await repository.findItinerarioByLinhaId(5);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('SELECT DISTINCT ON (v.sentido, hp.sequencia)');
      expect(sql).toContain('WHERE l.id = $1');
      expect(sql).toContain('ORDER BY v.sentido, hp.sequencia ASC');
      expect(params).toEqual([5]);
      expect(resultado).toEqual(paradas);
    });

    it('devolve lista vazia quando a linha não tem itinerário', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.findItinerarioByLinhaId(99);

      expect(resultado).toEqual([]);
    });
  });

  describe('findHorariosByLinhaId', () => {
    it('consulta os horários de partida da primeira parada da linha', async () => {
      const horarios = [{ sentido: 'IDA', tipo_dia: 'DIA_UTIL', horario_partida: '05:30' }];
      pool.query.mockResolvedValue({ rows: horarios });

      const resultado = await repository.findHorariosByLinhaId(5);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE l.id = $1 AND hp.sequencia = 1');
      expect(sql).toContain("TO_CHAR(hp.partida::time, 'HH24:MI') AS horario_partida");
      expect(sql).toContain('ORDER BY v.sentido, c.tipo_dia, hp.partida ASC');
      expect(params).toEqual([5]);
      expect(resultado).toEqual(horarios);
    });

    it('devolve lista vazia quando a linha não tem horários', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const resultado = await repository.findHorariosByLinhaId(99);

      expect(resultado).toEqual([]);
    });
  });

  describe('buscarPorId (RF23)', () => {
    it('busca a linha pelo id e devolve o registro', async () => {
      const linha = { id: '0.110', codigo: '0.110', nome: 'Asa Sul' };
      pool.query.mockResolvedValue({ rows: [linha] });

      const resultado = await repository.buscarPorId('0.110');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('FROM linhas WHERE id = $1');
      expect(params).toEqual(['0.110']);
      expect(resultado).toEqual(linha);
    });

    it('devolve null quando a linha não existe', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(repository.buscarPorId('999')).resolves.toBeNull();
    });
  });

  describe('criar (RF23)', () => {
    it('insere a linha usando o código também como id', async () => {
      const criada = { id: '0.110', codigo: '0.110', nome: 'Asa Sul' };
      pool.query.mockResolvedValue({ rows: [criada] });

      const resultado = await repository.criar({
        codigo: '0.110',
        nome: 'Asa Sul',
        cor: '#006666',
        tarifa: 5.5,
        faixaTarifaria: 'METROPOLITANA 1',
        operadora: 'Urbi',
        extensaoKm: 12.5,
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO linhas (id, codigo, nome, cor, tarifa, faixa_tarifaria, operadora, extensao_km)');
      expect(sql).toContain('VALUES ($1, $1, $2, $3, $4, $5, $6, $7)');
      expect(params).toEqual(['0.110', 'Asa Sul', '#006666', 5.5, 'METROPOLITANA 1', 'Urbi', 12.5]);
      expect(resultado).toEqual(criada);
    });

    it('propaga o erro do banco', async () => {
      pool.query.mockRejectedValue(new Error('falha no banco'));

      await expect(repository.criar({ codigo: '0.110', nome: 'Asa Sul' })).rejects.toThrow('falha no banco');
    });
  });

  describe('atualizar (RF23)', () => {
    it('atualiza os dados da linha pelo id sem mudar o código', async () => {
      const atualizada = { id: '0.110', codigo: '0.110', nome: 'Asa Norte' };
      pool.query.mockResolvedValue({ rows: [atualizada] });

      const resultado = await repository.atualizar('0.110', {
        nome: 'Asa Norte',
        cor: null,
        tarifa: null,
        faixaTarifaria: null,
        operadora: null,
        extensaoKm: null,
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('UPDATE linhas');
      expect(sql).toContain('SET nome = $2, cor = $3, tarifa = $4, faixa_tarifaria = $5, operadora = $6, extensao_km = $7');
      expect(sql).toContain('WHERE id = $1');
      expect(sql).not.toContain('codigo =');
      expect(params).toEqual(['0.110', 'Asa Norte', null, null, null, null, null]);
      expect(resultado).toEqual(atualizada);
    });
  });

  describe('excluir (RF23)', () => {
    it('exclui a linha pelo id', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      await repository.excluir('0.110');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toBe('DELETE FROM linhas WHERE id = $1');
      expect(params).toEqual(['0.110']);
    });
  });

  describe('listarPartidas (RF23)', () => {
    it('lista as viagens da linha no sentido e tipo de dia pela partida da sequência 1', async () => {
      const partidas = [{ viagem_id: 'TRIP_1', horario: '05:00' }];
      pool.query.mockResolvedValue({ rows: partidas });

      const resultado = await repository.listarPartidas('0.110', 'IDA', 'SABADO');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('hp.sequencia = 1');
      expect(sql).toContain('WHERE v.linha_id = $1 AND v.sentido = $2 AND c.tipo_dia = $3');
      expect(sql).toContain('ORDER BY hp.partida ASC');
      expect(params).toEqual(['0.110', 'IDA', 'SABADO']);
      expect(resultado).toEqual(partidas);
    });
  });

  describe('buscarPartida (RF23)', () => {
    it('busca a viagem garantindo que ela é da linha informada', async () => {
      const partida = { viagem_id: 'TRIP_1', sentido: 'IDA', tipo_dia: 'SABADO', horario: '05:00' };
      pool.query.mockResolvedValue({ rows: [partida] });

      const resultado = await repository.buscarPartida('0.110', 'TRIP_1');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('WHERE v.id = $1 AND v.linha_id = $2');
      expect(params).toEqual(['TRIP_1', '0.110']);
      expect(resultado).toEqual(partida);
    });

    it('devolve null quando a viagem não existe na linha', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(repository.buscarPartida('0.110', 'TRIP_X')).resolves.toBeNull();
    });
  });

  describe('buscarPartidaMaisProxima (RF23)', () => {
    it('ordena as viagens do sentido e tipo de dia pela distância até o horário informado', async () => {
      pool.query.mockResolvedValue({ rows: [{ viagem_id: 'TRIP_1', horario: '05:00' }] });

      const resultado = await repository.buscarPartidaMaisProxima('0.110', 'IDA', 'SABADO', '05:07:00');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('ORDER BY ABS(EXTRACT(EPOCH FROM (hp.partida - $4::time))) ASC');
      expect(sql).toContain('LIMIT 1');
      expect(params).toEqual(['0.110', 'IDA', 'SABADO', '05:07:00']);
      expect(resultado).toEqual({ viagem_id: 'TRIP_1', horario: '05:00' });
    });

    it('devolve null quando a linha não tem viagens nesse sentido e tipo de dia', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(repository.buscarPartidaMaisProxima('0.110', 'IDA', 'SABADO', '05:07:00')).resolves.toBeNull();
    });
  });

  describe('criarPartida (RF23)', () => {
    let client;

    beforeEach(() => {
      client = { query: jest.fn(), release: jest.fn() };
      pool.connect.mockResolvedValue(client);
    });

    it('copia a viagem modelo e desloca os horários numa transação', async () => {
      client.query.mockImplementation(async (sql) =>
        sql.includes('INSERT INTO viagens') ? { rows: [{ id: 'MANUAL_1' }] } : { rows: [] }
      );

      const resultado = await repository.criarPartida('TRIP_1', '05:07:00');

      const chamadas = client.query.mock.calls;
      expect(chamadas[0][0]).toBe('BEGIN');
      expect(chamadas[1][0]).toContain("SELECT 'MANUAL_' || gen_random_uuid(), linha_id, calendario_id, sentido, destino");
      expect(chamadas[1][1]).toEqual(['TRIP_1']);
      expect(chamadas[2][0]).toContain('INSERT INTO horarios_paradas (viagem_id, parada_id, sequencia, partida, chegada)');
      expect(chamadas[2][0]).toContain('hp.partida + ($3::time - inicio.partida)');
      expect(chamadas[2][1]).toEqual(['MANUAL_1', 'TRIP_1', '05:07:00']);
      expect(chamadas[3][0]).toBe('COMMIT');
      expect(client.release).toHaveBeenCalled();
      expect(resultado).toBe('MANUAL_1');
    });

    it('desfaz tudo e propaga o erro quando a cópia falha', async () => {
      client.query.mockImplementation(async (sql) => {
        if (sql.includes('INSERT INTO viagens')) return { rows: [{ id: 'MANUAL_1' }] };
        if (sql.includes('INSERT INTO horarios_paradas')) throw new Error('falha no banco');
        return { rows: [] };
      });

      await expect(repository.criarPartida('TRIP_1', '05:07:00')).rejects.toThrow('falha no banco');
      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
      expect(client.query).not.toHaveBeenCalledWith('COMMIT');
      expect(client.release).toHaveBeenCalled();
    });
  });

  describe('deslocarPartida (RF23)', () => {
    it('desloca todos os horários da viagem a partir da parada de sequência 1', async () => {
      pool.query.mockResolvedValue({ rowCount: 86 });

      await repository.deslocarPartida('TRIP_1', '05:09:00');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('UPDATE horarios_paradas hp');
      expect(sql).toContain('SET partida = hp.partida + ($2::time - inicio.partida)');
      expect(sql).toContain('chegada = hp.chegada + ($2::time - inicio.partida)');
      expect(sql).toContain('inicio.sequencia = 1');
      expect(params).toEqual(['TRIP_1', '05:09:00']);
    });
  });

  describe('excluirPartida (RF23)', () => {
    it('exclui a viagem pelo id', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      await repository.excluirPartida('TRIP_1');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toBe('DELETE FROM viagens WHERE id = $1');
      expect(params).toEqual(['TRIP_1']);
    });
  });
});
