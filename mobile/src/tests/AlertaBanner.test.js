import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AlertaBanner, { AlertaBadge, obterConfigAlerta } from '../components/AlertaBanner';

const ALERTA_DESVIO = {
  id: 1,
  tipo: 'DESVIO',
  titulo: 'Desvio na W3 Sul',
  descricao: 'Obras na pista lateral causam desvio de rota.',
};

const ALERTA_SUSPENSAO = {
  id: 2,
  tipo: 'SUSPENSAO',
  descricao: 'Parada temporariamente interditada.',
};

describe('AlertaBanner e AlertaBadge (RF14)', () => {
  describe('obterConfigAlerta', () => {
    it('retorna a configuração correta para cada tipo conhecido e padrão para desconhecido', () => {
      expect(obterConfigAlerta('DESVIO').rotulo).toBe('Desvio');
      expect(obterConfigAlerta('SUSPENSAO').rotulo).toBe('Suspensão');
      expect(obterConfigAlerta('PARALISACAO').rotulo).toBe('Paralisação');
      expect(obterConfigAlerta('ALTERACAO_HORARIO').rotulo).toBe('Alteração de Horário');
      expect(obterConfigAlerta('OUTRO').rotulo).toBe('Alerta');
    });
  });

  describe('AlertaBadge', () => {
    it('não renderiza nada quando não há alertas nem flag afetadaPorAlerta', () => {
      const { toJSON } = render(<AlertaBadge alertas={[]} afetadaPorAlerta={false} />);
      expect(toJSON()).toBeNull();
    });

    it('mostra o tipo do alerta quando há 1 alerta', () => {
      const { getByText } = render(<AlertaBadge alertas={[ALERTA_DESVIO]} afetadaPorAlerta />);
      expect(getByText('⚠ Alerta: Desvio')).toBeTruthy();
    });

    it('mostra a contagem quando há múltiplos alertas', () => {
      const { getByText } = render(
        <AlertaBadge alertas={[ALERTA_DESVIO, ALERTA_SUSPENSAO]} afetadaPorAlerta />
      );
      expect(getByText('⚠ 2 alertas ativos')).toBeTruthy();
    });

    it('mostra o texto padrão quando afetadaPorAlerta é true mas lista vem vazia', () => {
      const { getByText } = render(
        <AlertaBadge alertas={[]} afetadaPorAlerta textoPadrao="Trajeto afetado por alerta" />
      );
      expect(getByText('⚠ Trajeto afetado por alerta')).toBeTruthy();
    });
  });

  describe('AlertaBanner', () => {
    it('não renderiza nada quando não há alertas nem flag', () => {
      const { toJSON } = render(<AlertaBanner alertas={[]} afetadaPorAlerta={false} />);
      expect(toJSON()).toBeNull();
    });

    it('renderiza cabeçalho, tipo, título e descrição dos alertas vigentes', () => {
      const { getByText } = render(<AlertaBanner alertas={[ALERTA_DESVIO, ALERTA_SUSPENSAO]} />);

      expect(getByText('⚠ 2 alertas vigentes')).toBeTruthy();
      expect(getByText('Desvio — Desvio na W3 Sul')).toBeTruthy();
      expect(getByText('Obras na pista lateral causam desvio de rota.')).toBeTruthy();
      expect(getByText('Suspensão')).toBeTruthy();
      expect(getByText('Parada temporariamente interditada.')).toBeTruthy();
    });

    it('renderiza mensagem genérica quando afetadaPorAlerta é true sem lista de detalhes', () => {
      const { getByText } = render(<AlertaBanner alertas={[]} afetadaPorAlerta />);

      expect(getByText('⚠ Alerta vigente')).toBeTruthy();
      expect(
        getByText(
          'Este item possui alertas vigentes no serviço. Consulte a área de alertas para mais detalhes.'
        )
      ).toBeTruthy();
    });

    it('chama onPress ao tocar no banner quando a ação é fornecida', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <AlertaBanner alertas={[ALERTA_DESVIO]} onPress={onPress} />
      );

      expect(getByText('Ver detalhes ›')).toBeTruthy();
      fireEvent.press(getByText('Ver detalhes ›'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
