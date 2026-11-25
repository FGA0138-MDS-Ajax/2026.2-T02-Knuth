import {
  formatarExtensao,
  formatarOperadora,
  formatarTarifa,
  obterCorLinha,
} from '../utils/formatarMetadadosLinha';

describe('formatarMetadadosLinha', () => {
  describe('obterCorLinha', () => {
    it('retorna a cor hexadecimal normalizada para cores válidas de bacia', () => {
      expect(obterCorLinha('#1565c0')).toBe('#1565C0');
      expect(obterCorLinha('2e7d32')).toBe('#2E7D32');
    });

    it('usa a cor padrão #006666 para branco, nulo ou formato inválido', () => {
      expect(obterCorLinha('#FFFFFF')).toBe('#006666');
      expect(obterCorLinha('FFFFFF')).toBe('#006666');
      expect(obterCorLinha(null)).toBe('#006666');
      expect(obterCorLinha('azul')).toBe('#006666');
    });
  });

  describe('formatarTarifa', () => {
    it('formata valores positivos em reais com duas casas decimais', () => {
      expect(formatarTarifa(5.5)).toBe('R$ 5,50');
      expect(formatarTarifa('3.80')).toBe('R$ 3,80');
      expect(formatarTarifa(2.7)).toBe('R$ 2,70');
    });

    it('retorna null para valores ausentes ou inválidos', () => {
      expect(formatarTarifa(null)).toBeNull();
      expect(formatarTarifa(0)).toBeNull();
      expect(formatarTarifa('abc')).toBeNull();
    });
  });

  describe('formatarExtensao', () => {
    it('formata extensão em quilômetros com uma casa decimal', () => {
      expect(formatarExtensao(78.28)).toBe('78,3 km');
      expect(formatarExtensao('12')).toBe('12,0 km');
    });

    it('retorna null quando ausente ou inválida', () => {
      expect(formatarExtensao(undefined)).toBeNull();
      expect(formatarExtensao(-5)).toBeNull();
    });
  });

  describe('formatarOperadora', () => {
    it('formata nomes das empresas e bacias do DF de forma legível', () => {
      expect(formatarOperadora('VIAÇÃO PIRACICABANA - BACIA 01')).toBe('Piracicabana · Bacia 01');
      expect(formatarOperadora('VIAÇÃO PIONEIRA BACIA - 02')).toBe('Pioneira · Bacia 02');
      expect(formatarOperadora('COOBRATAETE - BACIA 02')).toBe('Coobrataete · Bacia 02');
      expect(formatarOperadora('URBI - MOBILID. URBANA - BACIA 03')).toBe('Urbi · Bacia 03');
      expect(formatarOperadora('AUTO VIAÇÃO MARECHAL - BACIA 04')).toBe('Marechal · Bacia 04');
      expect(formatarOperadora('EXPRESSO SÃO JOSÉ BACIA - 05')).toBe('São José · Bacia 05');
    });

    it('substitui nomes de permissionários pessoa física por Transporte Complementar (STPCR)', () => {
      expect(formatarOperadora('KAWAN QUEIROZ CARVALHO')).toBe('Transporte Complementar (STPCR)');
      expect(formatarOperadora('MILENA ALVES FERNANDES')).toBe('Transporte Complementar (STPCR)');
    });

    it('retorna null quando ausente ou vazia', () => {
      expect(formatarOperadora(null)).toBeNull();
      expect(formatarOperadora('   ')).toBeNull();
    });
  });
});
