import { Alert, Platform } from 'react-native';
import { mostrarAviso, confirmarAcao } from '../utils/dialogos';

const descritorOriginalDoOS = Object.getOwnPropertyDescriptor(Platform, 'OS');
function definirPlataforma(os) {
  Object.defineProperty(Platform, 'OS', { configurable: true, enumerable: true, get: () => os });
}

describe('dialogos', () => {
  const alertOriginal = window.alert;
  const confirmOriginal = window.confirm;
  let alertSpy;

  beforeEach(() => {
    window.alert = jest.fn();
    window.confirm = jest.fn();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
    window.alert = alertOriginal;
    window.confirm = confirmOriginal;
    Object.defineProperty(Platform, 'OS', descritorOriginalDoOS);
  });

  describe('mostrarAviso', () => {
    it('usa Alert.alert no celular', () => {
      definirPlataforma('android');

      mostrarAviso('Título', 'Mensagem');

      expect(alertSpy).toHaveBeenCalledWith('Título', 'Mensagem');
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('usa window.alert na web', () => {
      definirPlataforma('web');

      mostrarAviso('Título', 'Mensagem');

      expect(window.alert).toHaveBeenCalledWith('Título\n\nMensagem');
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  describe('confirmarAcao', () => {
    it('no celular, mostra "Cancelar" e o botão de confirmação destrutivo', () => {
      definirPlataforma('ios');
      const aoConfirmar = jest.fn();

      confirmarAcao('Excluir', 'Tem certeza?', 'Excluir', aoConfirmar);

      expect(alertSpy).toHaveBeenCalledWith('Excluir', 'Tem certeza?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: aoConfirmar },
      ]);
      expect(aoConfirmar).not.toHaveBeenCalled();
    });

    it('na web, executa a ação quando o usuário confirma', () => {
      definirPlataforma('web');
      window.confirm.mockReturnValue(true);
      const aoConfirmar = jest.fn();

      confirmarAcao('Excluir', 'Tem certeza?', 'Excluir', aoConfirmar);

      expect(window.confirm).toHaveBeenCalledWith('Excluir\n\nTem certeza?');
      expect(aoConfirmar).toHaveBeenCalledTimes(1);
    });

    it('na web, não executa a ação quando o usuário cancela', () => {
      definirPlataforma('web');
      window.confirm.mockReturnValue(false);
      const aoConfirmar = jest.fn();

      confirmarAcao('Excluir', 'Tem certeza?', 'Excluir', aoConfirmar);

      expect(aoConfirmar).not.toHaveBeenCalled();
    });
  });
});
