import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import {
  AuthContext,
  CadastroSemLoginError,
  type AuthContextValue,
} from '../../contexts/AuthContext';
import { authValue } from '../../test/authContextValue';
import { httpError, networkError } from '../../test/helpers';
import { LoginScreen } from './LoginScreen';

async function renderLogin(parcial: Partial<AuthContextValue> = {}) {
  const value = authValue({ status: 'signedOut', user: null, ...parcial });
  await render(
    <AuthContext.Provider value={value}>
      <LoginScreen />
    </AuthContext.Provider>,
  );
  return value;
}

const preencher = (testID: string, texto: string) =>
  fireEvent.changeText(screen.getByTestId(testID), texto);
const tocar = (testID: string) => fireEvent.press(screen.getByTestId(testID));

describe('LoginScreen: aba Login', () => {
  it('inicia na aba de login', async () => {
    await renderLogin();

    expect(screen.getByRole('header', { name: 'Entrar' })).toBeOnTheScreen();
    expect(screen.getByText('Acesse sua conta')).toBeOnTheScreen();
    expect(screen.getByTestId('aba-login')).toBeSelected();
  });

  it('não chama a API com o formulário inválido e mostra os erros dos campos', async () => {
    const value = await renderLogin();

    await tocar('login-entrar');

    expect(value.login).not.toHaveBeenCalled();
    expect(screen.getAllByText('Este campo é obrigatório.')).toHaveLength(2);

    await preencher('login-email', 'nao-e-email');
    await tocar('login-entrar');
    expect(screen.getByText('Email inválido.')).toBeOnTheScreen();
    expect(value.login).not.toHaveBeenCalled();
  });

  it('envia email (sem espaços) e senha para o login', async () => {
    const value = await renderLogin();

    await preencher('login-email', ' ana@clinica.com ');
    await preencher('login-senha', '12345678');
    await tocar('login-entrar');

    await waitFor(() => expect(value.login).toHaveBeenCalledWith('ana@clinica.com', '12345678'));
  });

  it('mostra "Entrando..." enquanto aguarda', async () => {
    let concluir: () => void = () => undefined;
    const pendente = new Promise<never>((_, reject) => {
      concluir = () => reject(new Error('fim do teste'));
    });
    await renderLogin({ login: jest.fn(() => pendente) });

    await preencher('login-email', 'ana@clinica.com');
    await preencher('login-senha', '12345678');
    const pressionando = tocar('login-entrar');

    expect(await screen.findByText('Entrando...')).toBeOnTheScreen();
    expect(screen.getByTestId('login-entrar')).toBeDisabled();

    await act(async () => {
      concluir();
      await pressionando;
    });
  });

  it.each([
    [httpError(401), 'Usuário ou senha incorreta.'],
    [networkError(), 'Sem conexão com o servidor. Verifique sua internet e tente novamente.'],
    [httpError(500), 'Não foi possível entrar. Tente novamente.'],
  ])('mostra a mensagem certa para cada erro (%#)', async (erro, mensagem) => {
    await renderLogin({
      login: jest.fn(async () => {
        throw erro;
      }),
    });

    await preencher('login-email', 'ana@clinica.com');
    await preencher('login-senha', 'errada');
    await tocar('login-entrar');

    expect(await screen.findByText(mensagem)).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Entrar' })).toBeOnTheScreen();
  });

  it('trocar de aba limpa a mensagem de erro', async () => {
    await renderLogin({
      login: jest.fn(async () => {
        throw httpError(401);
      }),
    });
    await preencher('login-email', 'ana@clinica.com');
    await preencher('login-senha', 'errada');
    await tocar('login-entrar');
    await screen.findByText('Usuário ou senha incorreta.');

    await tocar('aba-cadastrar');
    await tocar('aba-login');

    expect(screen.queryByText('Usuário ou senha incorreta.')).not.toBeOnTheScreen();
  });
});

describe('LoginScreen: aba Cadastrar', () => {
  async function abrirCadastro(parcial: Partial<AuthContextValue> = {}) {
    const value = await renderLogin(parcial);
    await tocar('aba-cadastrar');
    return value;
  }

  it('mostra o cadastro de paciente', async () => {
    await abrirCadastro();
    expect(screen.getByText('Criar conta')).toBeOnTheScreen();
    expect(screen.getByText('Cadastro de paciente')).toBeOnTheScreen();
  });

  it('valida nome, email e senha (mínimo 8) antes de chamar a API', async () => {
    const value = await abrirCadastro();

    await preencher('cadastro-nome', 'Joana');
    await preencher('cadastro-email', 'jo@x.com');
    await preencher('cadastro-senha', '123');
    await tocar('cadastro-enviar');

    expect(screen.getByText('Deve ter pelo menos 8 caracteres.')).toBeOnTheScreen();
    expect(value.cadastrar).not.toHaveBeenCalled();
  });

  it('cadastra com os dados informados', async () => {
    const value = await abrirCadastro();

    await preencher('cadastro-nome', ' Joana Dias ');
    await preencher('cadastro-email', 'jo@x.com');
    await preencher('cadastro-senha', '12345678');
    await tocar('cadastro-enviar');

    await waitFor(() =>
      expect(value.cadastrar).toHaveBeenCalledWith({
        nome: 'Joana Dias',
        email: 'jo@x.com',
        senha: '12345678',
      }),
    );
  });

  it('avisa de email duplicado (409)', async () => {
    await abrirCadastro({
      cadastrar: jest.fn(async () => {
        throw httpError(409);
      }),
    });

    await preencher('cadastro-nome', 'Joana');
    await preencher('cadastro-email', 'jo@x.com');
    await preencher('cadastro-senha', '12345678');
    await tocar('cadastro-enviar');

    expect(await screen.findByText('Já existe uma conta com este email.')).toBeOnTheScreen();
  });

  it('conta criada sem login automático: volta para a aba Login com o aviso e o email', async () => {
    await abrirCadastro({
      cadastrar: jest.fn(async () => {
        throw new CadastroSemLoginError(networkError());
      }),
    });

    await preencher('cadastro-nome', 'Joana');
    await preencher('cadastro-email', 'jo@x.com');
    await preencher('cadastro-senha', '12345678');
    await tocar('cadastro-enviar');

    expect(
      await screen.findByText(
        'Conta criada, mas não foi possível entrar automaticamente. Faça login.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('aba-login')).toBeSelected();
    expect(screen.getByTestId('login-email')).toHaveDisplayValue('jo@x.com');
  });
});
