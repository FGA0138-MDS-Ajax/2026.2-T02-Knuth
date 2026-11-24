const {
  CriterioOrdenacao,
  EstrategiaOrdenacao,
  EstrategiaMenorTempo,
  EstrategiaMenosBaldeacoes,
  EstrategiaMenorCaminhada,
  normalizarCriterioOrdenacao,
  obterEstrategiaOrdenacao,
  ordenarOpcoesTrajeto,
} = require('../services/ordenacaoTrajetos');

const OPCOES = [
  { id: 'A', duracaoMinutos: 40, baldeacoes: 0, caminhadaMetros: 250, partida: '08:10:00' },
  { id: 'B', duracaoMinutos: 25, baldeacoes: 1, caminhadaMetros: 120, partida: '08:05:00' },
  { id: 'C', duracaoMinutos: 35, baldeacoes: 0, caminhadaMetros: 0, partida: '08:20:00' },
  { id: 'D', duracaoMinutos: 25, baldeacoes: 0, caminhadaMetros: 300, partida: '08:15:00' },
];

describe('ordenacaoTrajetos (RF05 - Strategy)', () => {
  describe('normalizarCriterioOrdenacao', () => {
    it.each([
      ['TEMPO', CriterioOrdenacao.TEMPO],
      ['tempo', CriterioOrdenacao.TEMPO],
      [' baldeacoes ', CriterioOrdenacao.BALDEACOES],
      ['Caminhada', CriterioOrdenacao.CAMINHADA],
    ])('normaliza critério válido %p para %p', (entrada, esperado) => {
      expect(normalizarCriterioOrdenacao(entrada)).toBe(esperado);
    });

    it.each([undefined, null, '', '   ', 'PRECO', 'DISTANCIA'])(
      'retorna null para critério ausente ou inválido (%p)',
      (entrada) => {
        expect(normalizarCriterioOrdenacao(entrada)).toBeNull();
      }
    );
  });

  describe('obterEstrategiaOrdenacao', () => {
    it('retorna a estratégia correspondente a cada critério', () => {
      expect(obterEstrategiaOrdenacao('TEMPO')).toBeInstanceOf(EstrategiaMenorTempo);
      expect(obterEstrategiaOrdenacao('BALDEACOES')).toBeInstanceOf(EstrategiaMenosBaldeacoes);
      expect(obterEstrategiaOrdenacao('CAMINHADA')).toBeInstanceOf(EstrategiaMenorCaminhada);
      expect(obterEstrategiaOrdenacao('INVALIDO')).toBeNull();
    });

    it('exige que a classe base EstrategiaOrdenacao implemente comparar()', () => {
      const base = new EstrategiaOrdenacao();
      expect(() => base.comparar(OPCOES[0], OPCOES[1])).toThrow(
        'Método comparar() deve ser implementado pela subclasse.'
      );
      expect(base.ordenar(null)).toEqual([]);
    });
  });

  describe('ordenarOpcoesTrajeto', () => {
    it('ordena por menor tempo total com desempate por menos baldeações', () => {
      const resultado = ordenarOpcoesTrajeto(OPCOES, CriterioOrdenacao.TEMPO);

      expect(resultado.map((o) => o.id)).toEqual(['D', 'B', 'C', 'A']);
    });

    it('ordena por menor número de baldeações com desempate por menor tempo', () => {
      const resultado = ordenarOpcoesTrajeto(OPCOES, CriterioOrdenacao.BALDEACOES);

      expect(resultado.map((o) => o.id)).toEqual(['D', 'C', 'A', 'B']);
    });

    it('ordena por menor distância de caminhada com desempate por menor tempo', () => {
      const resultado = ordenarOpcoesTrajeto(OPCOES, CriterioOrdenacao.CAMINHADA);

      expect(resultado.map((o) => o.id)).toEqual(['C', 'B', 'A', 'D']);
    });

    it('desempata por horário de partida quando todas as métricas são iguais', () => {
      const empatadas = [
        { id: 'tarde', duracaoMinutos: 20, baldeacoes: 0, caminhadaMetros: 0, partida: '09:00:00' },
        { id: 'cedo', duracaoMinutos: 20, baldeacoes: 0, caminhadaMetros: 0, partida: '08:00:00' },
      ];

      expect(ordenarOpcoesTrajeto(empatadas, CriterioOrdenacao.TEMPO).map((o) => o.id)).toEqual([
        'cedo',
        'tarde',
      ]);
    });

    it('não muta o array original e preserva todos os campos das opções', () => {
      const original = OPCOES.map((o) => ({ ...o }));
      const ordenado = ordenarOpcoesTrajeto(original, CriterioOrdenacao.CAMINHADA);

      expect(original.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D']);
      expect(ordenado[0]).toEqual(OPCOES[2]);
    });

    it('mantém a ordem original quando o critério não é informado ou é inválido', () => {
      expect(ordenarOpcoesTrajeto(OPCOES, null).map((o) => o.id)).toEqual(['A', 'B', 'C', 'D']);
      expect(ordenarOpcoesTrajeto(OPCOES, 'INEXISTENTE').map((o) => o.id)).toEqual([
        'A',
        'B',
        'C',
        'D',
      ]);
      expect(ordenarOpcoesTrajeto(null, CriterioOrdenacao.TEMPO)).toEqual([]);
    });
  });
});
