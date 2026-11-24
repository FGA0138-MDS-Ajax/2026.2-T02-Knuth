import {
  MODOS_HORARIO,
  aplicarMascaraHorario,
  validarHorarioTexto,
  formatarResumoPlanejamento,
} from '../utils/planejamentoHorario';

describe('planejamentoHorario (RF06)', () => {
  it('aplica máscara HH:MM preservando apenas dígitos', () => {
    expect(aplicarMascaraHorario('0830')).toBe('08:30');
    expect(aplicarMascaraHorario('08')).toBe('08');
    expect(aplicarMascaraHorario('08a:3b0c99')).toBe('08:30');
    expect(aplicarMascaraHorario('')).toBe('');
  });

  it('valida horários válidos e rejeita inválidos', () => {
    expect(validarHorarioTexto('00:00')).toBe('00:00');
    expect(validarHorarioTexto('08:30')).toBe('08:30');
    expect(validarHorarioTexto('23:59')).toBe('23:59');
    expect(validarHorarioTexto('24:00')).toBeNull();
    expect(validarHorarioTexto('12:60')).toBeNull();
    expect(validarHorarioTexto('8:30')).toBeNull();
    expect(validarHorarioTexto('')).toBeNull();
  });

  it('formata o resumo do planejamento para PARTIDA e CHEGADA', () => {
    expect(
      formatarResumoPlanejamento({
        referenciaHorario: MODOS_HORARIO.PARTIDA,
        horario: '08:30:00',
      })
    ).toBe('Partida às 08:30');
    expect(
      formatarResumoPlanejamento({
        referenciaHorario: MODOS_HORARIO.CHEGADA,
        horario: '09:00',
      })
    ).toBe('Chegada até 09:00');
    expect(formatarResumoPlanejamento(null)).toBeNull();
  });
});
