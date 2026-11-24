const {
  ReferenciaHorario,
  normalizarHorario,
  normalizarReferenciaHorario,
  interpretarFiltroHorario,
} = require('../utils/horarioConsulta');

describe('horarioConsulta (RF06)', () => {
  describe('normalizarHorario', () => {
    it.each([
      ['08:30', '08:30:00'],
      [' 00:00 ', '00:00:00'],
      ['23:59', '23:59:00'],
      ['14:05:30', '14:05:30'],
    ])('normaliza horário válido %p para %p', (entrada, esperado) => {
      expect(normalizarHorario(entrada)).toBe(esperado);
    });

    it.each([undefined, null, '', '8:30', '24:00', '12:60', '12:30:60', 'ab:cd', '0830'])(
      'retorna null para horário inválido (%p)',
      (entrada) => {
        expect(normalizarHorario(entrada)).toBeNull();
      }
    );
  });

  describe('normalizarReferenciaHorario', () => {
    it.each([
      ['PARTIDA', ReferenciaHorario.PARTIDA],
      ['partida', ReferenciaHorario.PARTIDA],
      [' chegada ', ReferenciaHorario.CHEGADA],
    ])('normaliza referência válida %p para %p', (entrada, esperado) => {
      expect(normalizarReferenciaHorario(entrada)).toBe(esperado);
    });

    it.each([undefined, null, '', '   ', 'AGORA', 'SAIDA'])(
      'retorna null para referência inválida (%p)',
      (entrada) => {
        expect(normalizarReferenciaHorario(entrada)).toBeNull();
      }
    );
  });

  describe('interpretarFiltroHorario', () => {
    it('retorna filtro nulo e sem erro quando nenhum parâmetro é informado', () => {
      expect(interpretarFiltroHorario({})).toEqual({ filtro: null, erro: null });
      expect(interpretarFiltroHorario()).toEqual({ filtro: null, erro: null });
    });

    it('assume PARTIDA como referência padrão quando apenas horario é informado', () => {
      expect(interpretarFiltroHorario({ horario: '08:15' })).toEqual({
        filtro: { referencia: ReferenciaHorario.PARTIDA, horario: '08:15:00' },
        erro: null,
      });
    });

    it('interpreta corretamente o modo CHEGADA', () => {
      expect(
        interpretarFiltroHorario({ horario: '09:30', referenciaHorario: 'chegada' })
      ).toEqual({
        filtro: { referencia: ReferenciaHorario.CHEGADA, horario: '09:30:00' },
        erro: null,
      });
    });

    it('retorna erro quando referenciaHorario é informada sem horario', () => {
      expect(interpretarFiltroHorario({ referenciaHorario: 'CHEGADA' })).toEqual({
        filtro: null,
        erro: 'Informe o parâmetro horario (HH:MM) junto com referenciaHorario.',
      });
    });

    it('retorna erro quando horario tem formato inválido', () => {
      expect(interpretarFiltroHorario({ horario: '25:00' })).toEqual({
        filtro: null,
        erro: 'Parâmetro horario inválido. Use o formato HH:MM (ex.: 08:30).',
      });
    });

    it('retorna erro quando referenciaHorario é inválida', () => {
      expect(
        interpretarFiltroHorario({ horario: '08:00', referenciaHorario: 'INVALIDA' })
      ).toEqual({
        filtro: null,
        erro: 'Parâmetro referenciaHorario inválido. Use PARTIDA ou CHEGADA.',
      });
    });
  });
});
