import {
  CRITERIOS_ORDENACAO,
  ordenarEFiltrarTrajetos,
  formatarCaminhada,
  obterSeloMelhorOpcao,
} from '../utils/ordenarTrajetos';

const OPCOES = [
  { id: '1', duracaoMinutos: 45, baldeacoes: 0, caminhadaMetros: 320, partida: '08:00' },
  { id: '2', duracaoMinutos: 25, baldeacoes: 1, caminhadaMetros: 100, partida: '08:05' },
  { id: '3', duracaoMinutos: 35, baldeacoes: 0, caminhadaMetros: 0, partida: '08:10' },
];

describe('ordenarTrajetos (RF05)', () => {
  it('mantém a ordem original quando nenhum critério é informado', () => {
    const resultado = ordenarEFiltrarTrajetos(OPCOES);

    expect(resultado.map((o) => o.id)).toEqual(['1', '2', '3']);
  });

  it('ordena por menor tempo total', () => {
    const resultado = ordenarEFiltrarTrajetos(OPCOES, {
      criterio: CRITERIOS_ORDENACAO.TEMPO,
    });

    expect(resultado.map((o) => o.id)).toEqual(['2', '3', '1']);
  });

  it('ordena por menor número de baldeações desempatando por menor tempo', () => {
    const resultado = ordenarEFiltrarTrajetos(OPCOES, {
      criterio: CRITERIOS_ORDENACAO.BALDEACOES,
    });

    expect(resultado.map((o) => o.id)).toEqual(['3', '1', '2']);
  });

  it('ordena por menor distância de caminhada', () => {
    const resultado = ordenarEFiltrarTrajetos(OPCOES, {
      criterio: CRITERIOS_ORDENACAO.CAMINHADA,
    });

    expect(resultado.map((o) => o.id)).toEqual(['3', '2', '1']);
  });

  it('filtra apenas opções diretas e combina com a ordenação escolhida', () => {
    const resultado = ordenarEFiltrarTrajetos(OPCOES, {
      criterio: CRITERIOS_ORDENACAO.TEMPO,
      somenteDiretos: true,
    });

    expect(resultado.map((o) => o.id)).toEqual(['3', '1']);
  });

  it('não muta o array original e retorna lista vazia para entrada inválida', () => {
    const copia = OPCOES.map((item) => ({ ...item }));
    ordenarEFiltrarTrajetos(copia, { criterio: CRITERIOS_ORDENACAO.TEMPO });

    expect(copia.map((o) => o.id)).toEqual(['1', '2', '3']);
    expect(ordenarEFiltrarTrajetos(null)).toEqual([]);
  });

  it('formata distância de caminhada corretamente', () => {
    expect(formatarCaminhada(0)).toBe('Sem caminhada');
    expect(formatarCaminhada(185)).toBe('185 m a pé');
    expect(formatarCaminhada(1250)).toBe('1,3 km a pé');
    expect(formatarCaminhada(undefined)).toBeNull();
    expect(formatarCaminhada(-10)).toBeNull();
  });

  it('retorna o selo correspondente ao critério ativo', () => {
    expect(obterSeloMelhorOpcao(CRITERIOS_ORDENACAO.TEMPO)).toBe('Mais rápida');
    expect(obterSeloMelhorOpcao(CRITERIOS_ORDENACAO.BALDEACOES)).toBe('Menos baldeações');
    expect(obterSeloMelhorOpcao(CRITERIOS_ORDENACAO.CAMINHADA)).toBe('Menor caminhada');
    expect(obterSeloMelhorOpcao(null)).toBeNull();
  });
});
