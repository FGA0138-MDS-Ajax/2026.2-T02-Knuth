import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RecuperarSenhaScreen from '../screens/RecuperarSenhaScreen';
import { solicitarRecuperacaoSenha, redefinirSenha } from '../services/api';
import { mostrarAviso } from '../utils/dialogos';

jest.mock('../services/api', () => ({
  solicitarRecuperacaoSenha: jest.fn(),
  redefinirSenha: jest.fn(),
}));

jest.mock('../utils/dialogos', () => ({
  mostrarAviso: jest.fn(),
  confirmarAcao: jest.fn(),
}));

const EMAIL = 'maria@email.com';
const MSG_ENVIADO = 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.';

// -----testes------
describe('RecuperarSenhaScreen', () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };

  const renderTela = (params) =>
    render(<RecuperarSenhaScreen navigation={navigation} route={{ params }} />);

  const irParaEtapaCodigo = async (resposta = { mensagem: MSG_ENVIADO }) => {
    solicitarRecuperacaoSenha.mockResolvedValue(resposta);
    const tela = renderTela({ email: EMAIL });
    fireEvent.press(tela.getByText('Enviar código'));
    await tela.findByText('Criar nova senha');
    mostrarAviso.mockClear();
    return tela;
  };

  const preencherNovaSenha = (tela, { codigo, novaSenha, confirmacao }) => {
    if (codigo !== undefined) fireEvent.changeText(tela.getByPlaceholderText('Código de 6 dígitos'), codigo);
    if (novaSenha !== undefined) fireEvent.changeText(tela.getByPlaceholderText('Nova senha'), novaSenha);
    if (confirmacao !== undefined) {
      fireEvent.changeText(tela.getByPlaceholderText('Confirmar nova senha'), confirmacao);
    }
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('etapa 1 - e-mail', () => {
    it('mostra o título, o campo de e-mail e o botão "Enviar código"', () => {
      const { getByText, getByPlaceholderText } = renderTela();

      expect(getByText('Recuperar senha')).toBeTruthy();
      const email = getByPlaceholderText('E-mail');
      expect(email.props.keyboardType).toBe('email-address');
      expect(email.props.autoCapitalize).toBe('none');
      expect(getByText('Enviar código')).toBeTruthy();
    });

    it('preenche o e-mail recebido da tela de login', () => {
      const { getByPlaceholderText } = renderTela({ email: EMAIL });

      expect(getByPlaceholderText('E-mail').props.value).toBe(EMAIL);
    });

    it('avisa quando o e-mail não foi informado', () => {
      const { getByText } = renderTela();

      fireEvent.press(getByText('Enviar código'));

      expect(mostrarAviso).toHaveBeenCalledWith('Atenção', 'Informe o e-mail da sua conta.');
      expect(solicitarRecuperacaoSenha).not.toHaveBeenCalled();
    });

    it('avisa quando o e-mail é inválido', () => {
      const tela = renderTela();
      fireEvent.changeText(tela.getByPlaceholderText('E-mail'), 'maria-email');

      fireEvent.press(tela.getByText('Enviar código'));

      expect(mostrarAviso).toHaveBeenCalledWith('Atenção', 'Informe um e-mail válido.');
      expect(solicitarRecuperacaoSenha).not.toHaveBeenCalled();
    });

    it('envia o e-mail sem espaços, mostra a mensagem e avança para a etapa do código', async () => {
      solicitarRecuperacaoSenha.mockResolvedValue({ mensagem: MSG_ENVIADO });
      const tela = renderTela();
      fireEvent.changeText(tela.getByPlaceholderText('E-mail'), `  ${EMAIL} `);

      fireEvent.press(tela.getByText('Enviar código'));

      expect(await tela.findByText('Criar nova senha')).toBeTruthy();
      expect(solicitarRecuperacaoSenha).toHaveBeenCalledWith(EMAIL);
      expect(mostrarAviso).toHaveBeenCalledWith('Verifique seu e-mail', MSG_ENVIADO);
      expect(tela.getByText(`Digite o código enviado para ${EMAIL} e escolha uma nova senha.`)).toBeTruthy();
    });

    it('mostra o código de desenvolvimento quando a API o devolve', async () => {
      solicitarRecuperacaoSenha.mockResolvedValue({ mensagem: MSG_ENVIADO, codigoDev: '123456' });
      const tela = renderTela({ email: EMAIL });

      fireEvent.press(tela.getByText('Enviar código'));

      await waitFor(() =>
        expect(mostrarAviso).toHaveBeenCalledWith(
          'Verifique seu e-mail',
          `${MSG_ENVIADO}\n\nCódigo (ambiente de desenvolvimento): 123456`
        )
      );
    });

    it('usa a mensagem padrão quando a API não devolve mensagem', async () => {
      solicitarRecuperacaoSenha.mockResolvedValue({});
      const tela = renderTela({ email: EMAIL });

      fireEvent.press(tela.getByText('Enviar código'));

      await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Verifique seu e-mail', MSG_ENVIADO));
    });

    it('mostra o erro da API e permanece na etapa do e-mail', async () => {
      solicitarRecuperacaoSenha.mockRejectedValue({ response: { data: { detalhes: 'O email é obrigatório.' } } });
      const tela = renderTela({ email: EMAIL });

      fireEvent.press(tela.getByText('Enviar código'));

      await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'O email é obrigatório.'));
      expect(tela.getByText('Recuperar senha')).toBeTruthy();
    });

    it('mostra mensagem genérica quando a falha não traz detalhes', async () => {
      solicitarRecuperacaoSenha.mockRejectedValue(new Error('Network Error'));
      const tela = renderTela({ email: EMAIL });

      fireEvent.press(tela.getByText('Enviar código'));

      await waitFor(() =>
        expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível enviar o código. Tente novamente.')
      );
    });

    it('troca o texto do botão por um indicador enquanto envia', () => {
      solicitarRecuperacaoSenha.mockReturnValue(new Promise(() => {}));
      const tela = renderTela({ email: EMAIL });

      fireEvent.press(tela.getByText('Enviar código'));

      expect(tela.queryByText('Enviar código')).toBeNull();
      expect(tela.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('"Voltar para o login" leva para a tela de Login', () => {
      const { getByText } = renderTela();

      fireEvent.press(getByText('Voltar para o login'));

      expect(navigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('etapa 2 - código e nova senha', () => {
    it('mostra os campos de código e senha configurados corretamente', async () => {
      const tela = await irParaEtapaCodigo();

      const codigo = tela.getByPlaceholderText('Código de 6 dígitos');
      expect(codigo.props.keyboardType).toBe('number-pad');
      expect(codigo.props.maxLength).toBe(6);
      expect(tela.getByPlaceholderText('Nova senha').props.secureTextEntry).toBe(true);
      expect(tela.getByPlaceholderText('Confirmar nova senha').props.secureTextEntry).toBe(true);
    });

    it('avisa quando algum campo não foi preenchido', async () => {
      const tela = await irParaEtapaCodigo();
      preencherNovaSenha(tela, { codigo: '123456', novaSenha: 'novaSenha' });

      fireEvent.press(tela.getByText('Redefinir senha'));

      expect(mostrarAviso).toHaveBeenCalledWith('Atenção', 'Preencha todos os campos.');
      expect(redefinirSenha).not.toHaveBeenCalled();
    });

    it('avisa quando o código não tem 6 dígitos', async () => {
      const tela = await irParaEtapaCodigo();
      preencherNovaSenha(tela, { codigo: '12a45', novaSenha: 'novaSenha', confirmacao: 'novaSenha' });

      fireEvent.press(tela.getByText('Redefinir senha'));

      expect(mostrarAviso).toHaveBeenCalledWith('Atenção', 'O código deve ter 6 dígitos.');
      expect(redefinirSenha).not.toHaveBeenCalled();
    });

    it('avisa quando a nova senha tem menos de 6 caracteres', async () => {
      const tela = await irParaEtapaCodigo();
      preencherNovaSenha(tela, { codigo: '123456', novaSenha: '12345', confirmacao: '12345' });

      fireEvent.press(tela.getByText('Redefinir senha'));

      expect(mostrarAviso).toHaveBeenCalledWith('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
      expect(redefinirSenha).not.toHaveBeenCalled();
    });

    it('avisa quando a confirmação não confere', async () => {
      const tela = await irParaEtapaCodigo();
      preencherNovaSenha(tela, { codigo: '123456', novaSenha: 'novaSenha', confirmacao: 'outraSenha' });

      fireEvent.press(tela.getByText('Redefinir senha'));

      expect(mostrarAviso).toHaveBeenCalledWith('Atenção', 'As senhas não conferem.');
      expect(redefinirSenha).not.toHaveBeenCalled();
    });

    it('redefine a senha, avisa o sucesso e leva para o Login', async () => {
      redefinirSenha.mockResolvedValue({ mensagem: 'Senha redefinida com sucesso.' });
      const tela = await irParaEtapaCodigo();
      preencherNovaSenha(tela, { codigo: ' 123456 ', novaSenha: 'novaSenha', confirmacao: 'novaSenha' });

      fireEvent.press(tela.getByText('Redefinir senha'));

      await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('Login'));
      expect(redefinirSenha).toHaveBeenCalledWith(EMAIL, '123456', 'novaSenha');
      expect(mostrarAviso).toHaveBeenCalledWith(
        'Senha redefinida',
        'Sua senha foi alterada. Faça login com a nova senha.'
      );
    });

    it('mostra o erro da API (código inválido) e não navega', async () => {
      redefinirSenha.mockRejectedValue({ response: { data: { detalhes: 'Código inválido ou expirado.' } } });
      const tela = await irParaEtapaCodigo();
      preencherNovaSenha(tela, { codigo: '000000', novaSenha: 'novaSenha', confirmacao: 'novaSenha' });

      fireEvent.press(tela.getByText('Redefinir senha'));

      await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Código inválido ou expirado.'));
      expect(navigation.navigate).not.toHaveBeenCalled();
      expect(await tela.findByText('Redefinir senha')).toBeTruthy();
    });

    it('mostra mensagem genérica quando a redefinição falha sem detalhes', async () => {
      redefinirSenha.mockRejectedValue(new Error('Network Error'));
      const tela = await irParaEtapaCodigo();
      preencherNovaSenha(tela, { codigo: '123456', novaSenha: 'novaSenha', confirmacao: 'novaSenha' });

      fireEvent.press(tela.getByText('Redefinir senha'));

      await waitFor(() =>
        expect(mostrarAviso).toHaveBeenCalledWith('Erro', 'Não foi possível redefinir a senha. Tente novamente.')
      );
    });

    it('"Reenviar código" solicita um novo código para o mesmo e-mail', async () => {
      const tela = await irParaEtapaCodigo();

      fireEvent.press(tela.getByText('Não recebeu? Reenviar código'));

      await waitFor(() => expect(solicitarRecuperacaoSenha).toHaveBeenCalledTimes(2));
      expect(solicitarRecuperacaoSenha).toHaveBeenLastCalledWith(EMAIL);
    });

    it('"Usar outro e-mail" volta para a etapa do e-mail', async () => {
      const tela = await irParaEtapaCodigo();

      fireEvent.press(tela.getByText('Usar outro e-mail'));

      expect(tela.getByText('Recuperar senha')).toBeTruthy();
      expect(tela.getByPlaceholderText('E-mail').props.value).toBe(EMAIL);
    });
  });
});
