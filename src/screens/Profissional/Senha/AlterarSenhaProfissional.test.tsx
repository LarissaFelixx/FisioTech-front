import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { Session } from '../../../api/session';
import { ConfirmDialogProvider } from '../../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext, AuthProvider } from '../../../contexts/AuthContext';
import { ProfissionalNavigator } from '../../../navigation/ProfissionalNavigator';
import { RootNavigator } from '../../../navigation/RootNavigator';
import { consultaService } from '../../../services/consultaService';
import { pacienteService } from '../../../services/pacienteService';
import { profissionalService } from '../../../services/profissionalService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { fakeClient, httpError, networkError, Providers } from '../../../test/helpers';
import {
  MENSAGEM_SENHAS_DIFERENTES,
  MENSAGEM_SENHA_IGUAL,
  mensagemErroSenha,
  validarSenha,
} from '../../../utils/senha';

jest.mock('../../../services/consultaService');
jest.mock('../../../services/pacienteService');
jest.mock('../../../services/profissionalService');

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(consultaService.listarTodos).mockResolvedValue([]);
  jest.mocked(pacienteService.listarTodos).mockResolvedValue([]);
  jest.mocked(profissionalService.alterarPropriaSenha).mockResolvedValue(undefined);
});

async function preencher(atual: string, nova: string, confirmacao = nova) {
  await fireEvent.changeText(screen.getByTestId('senha-senhaAtual'), atual);
  await fireEvent.changeText(screen.getByTestId('senha-novaSenha'), nova);
  await fireEvent.changeText(screen.getByTestId('senha-confirmarNovaSenha'), confirmacao);
  await fireEvent.press(screen.getByTestId('senha-enviar'));
}

async function abrirPeloMenu() {
  await fireEvent.press(await screen.findByTestId('home-perfil'));
  await fireEvent.press(await screen.findByText('Alterar Senha'));
  await screen.findByRole('header', { name: 'Alterar Senha' });
}

describe('regras da troca de senha', () => {
  it('exige os três campos, nova senha com 8 a 100 caracteres e confirmação igual', () => {
    expect(validarSenha({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' })).toEqual({
      senhaAtual: 'Este campo é obrigatório.',
      novaSenha: 'Este campo é obrigatório.',
      confirmarNovaSenha: 'Este campo é obrigatório.',
    });
    expect(
      validarSenha({ senhaAtual: 'a', novaSenha: '1234567', confirmarNovaSenha: '1234567' }),
    ).toEqual({ novaSenha: expect.stringContaining('8') });
    const longa = 'x'.repeat(101);
    expect(validarSenha({ senhaAtual: 'a', novaSenha: longa, confirmarNovaSenha: longa })).toEqual({
      novaSenha: expect.stringContaining('100'),
    });
    expect(
      validarSenha({ senhaAtual: 'a', novaSenha: '12345678', confirmarNovaSenha: '12345679' }),
    ).toEqual({ confirmarNovaSenha: MENSAGEM_SENHAS_DIFERENTES });
    expect(
      validarSenha({ senhaAtual: 'a', novaSenha: '12345678', confirmarNovaSenha: '12345678' }),
    ).toEqual({});
  });

  it('a nova senha precisa ser diferente da atual', () => {
    expect(
      validarSenha({
        senhaAtual: 'senha-123',
        novaSenha: 'senha-123',
        confirmarNovaSenha: 'senha-123',
      }),
    ).toEqual({ novaSenha: MENSAGEM_SENHA_IGUAL });
  });

  it('400 é senha atual incorreta; rede e demais erros têm mensagem própria', () => {
    expect(mensagemErroSenha(httpError(400))).toBe('Senha atual incorreta.');
    expect(mensagemErroSenha(httpError(500))).toBe(
      'Não foi possível alterar a senha. Tente novamente.',
    );
    expect(mensagemErroSenha(networkError())).toMatch(/Sem conexão/);
  });
});

describe('Profissional — Alterar Senha (S5-08)', () => {
  async function abrir(parcial: Parameters<typeof authValue>[0] = {}) {
    const value = authValue(parcial);
    await render(
      <Providers navigation>
        <AuthContext.Provider value={value}>
          <ConfirmDialogProvider>
            <ProfissionalNavigator />
          </ConfirmDialogProvider>
        </AuthContext.Provider>
      </Providers>,
    );
    await abrirPeloMenu();
    return value;
  }

  it('mostra nome e perfil e mascara os campos de senha', async () => {
    await abrir();
    expect(screen.getByTestId('senha-subtitulo')).toHaveTextContent('Dra. Ana Lima · Profissional');
    for (const id of ['senha-senhaAtual', 'senha-novaSenha', 'senha-confirmarNovaSenha']) {
      expect(screen.getByTestId(id)).toHaveProp('secureTextEntry', true);
    }
    expect(screen.getByText(/você sai de todos os outros dispositivos/)).toBeOnTheScreen();
  });

  it('troca pelo endpoint do profissional, entra de novo e limpa o formulário', async () => {
    const value = await abrir();
    await preencher('senha-velha', 'senha-nova-123');

    await waitFor(() =>
      expect(profissionalService.alterarPropriaSenha).toHaveBeenCalledWith({
        senhaAtual: 'senha-velha',
        novaSenha: 'senha-nova-123',
      }),
    );
    expect(await screen.findByTestId('senha-sucesso')).toHaveTextContent(
      'Senha alterada com sucesso.',
    );
    expect(value.login).toHaveBeenCalledWith('ana@clinica.com', 'senha-nova-123');
    expect(value.logout).not.toHaveBeenCalled();
    expect(screen.getByTestId('senha-senhaAtual')).toHaveDisplayValue('');
  });

  it('mostra carregamento e bloqueia os campos durante o envio', async () => {
    let concluir: () => void = () => {};
    jest.mocked(profissionalService.alterarPropriaSenha).mockReturnValue(
      new Promise<void>((resolve) => {
        concluir = resolve;
      }),
    );
    await abrir();
    await preencher('senha-velha', 'senha-nova-123');

    expect(await screen.findByText('Alterando...')).toBeOnTheScreen();
    expect(screen.getByTestId('senha-enviar')).toBeDisabled();
    expect(screen.getByTestId('senha-novaSenha')).toHaveProp('editable', false);
    concluir();
    expect(await screen.findByTestId('senha-sucesso')).toBeOnTheScreen();
  });

  it('se o novo login falhar, desloga', async () => {
    const value = await abrir({
      login: jest.fn(async () => {
        throw networkError();
      }),
    });
    await preencher('senha-velha', 'senha-nova-123');
    await waitFor(() => expect(value.logout).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('senha-sucesso')).not.toBeOnTheScreen();
  });

  it('validação local não chama o backend', async () => {
    await abrir();
    await preencher('senha-velha', 'senha-nova-123', 'outra-senha-123');
    expect(screen.getByText(MENSAGEM_SENHAS_DIFERENTES)).toBeOnTheScreen();
    await preencher('senha-velha', 'senha-velha');
    expect(screen.getByText(MENSAGEM_SENHA_IGUAL)).toBeOnTheScreen();
    expect(profissionalService.alterarPropriaSenha).not.toHaveBeenCalled();
  });

  it('senha atual incorreta (400) fica na tela sem relogar', async () => {
    jest.mocked(profissionalService.alterarPropriaSenha).mockRejectedValue(httpError(400));
    const value = await abrir();
    await preencher('errada-123', 'senha-nova-123');
    expect(await screen.findByTestId('senha-erro')).toHaveTextContent('Senha atual incorreta.');
    expect(value.login).not.toHaveBeenCalled();
    expect(value.logout).not.toHaveBeenCalled();
  });

  it('sem conexão: mantém a sessão e mostra o erro', async () => {
    jest.mocked(profissionalService.alterarPropriaSenha).mockRejectedValue(networkError());
    const value = await abrir();
    await preencher('senha-velha', 'senha-nova-123');
    expect(await screen.findByTestId('senha-erro')).toHaveTextContent(/Sem conexão/);
    expect(value.logout).not.toHaveBeenCalled();
  });

  it('"‹ Home" volta para a Home', async () => {
    await abrir();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar para Home' }));
    expect(await screen.findByTestId('home-perfil')).toBeOnTheScreen();
  });
});

describe('fluxo de sessão com o AuthProvider real', () => {
  function sessao(): Session & { login: jest.Mock } {
    return {
      login: jest.fn(async () => undefined),
      refresh: jest.fn(async () => 'access'),
      logout: jest.fn(async () => undefined),
      clearLocal: jest.fn(async () => undefined),
      getAccessToken: () => 'access',
      hasStoredSession: jest.fn(async () => true),
    };
  }

  async function abrirApp(session: Session) {
    await render(
      <Providers navigation>
        <AuthProvider
          dependencies={{
            session,
            client: fakeClient(() => ({ status: 200 })),
            fetchMe: jest.fn(async () => usuarioProfissional),
          }}
        >
          <ConfirmDialogProvider>
            <RootNavigator />
          </ConfirmDialogProvider>
        </AuthProvider>
      </Providers>,
    );
    await abrirPeloMenu();
  }

  it('a troca de senha reloga com a nova senha e o profissional continua na mesma tela', async () => {
    const session = sessao();
    await abrirApp(session);
    await preencher('senha-velha', 'senha-nova-123');

    expect(await screen.findByTestId('senha-sucesso')).toBeOnTheScreen();
    expect(session.login).toHaveBeenCalledWith({
      email: 'ana@clinica.com',
      senha: 'senha-nova-123',
    });
    expect(session.logout).not.toHaveBeenCalled();
    expect(screen.getByRole('header', { name: 'Alterar Senha' })).toBeOnTheScreen();
  });

  it('se o novo login for recusado, volta para a tela de login', async () => {
    const session = sessao();
    session.login.mockRejectedValue(httpError(401));
    await abrirApp(session);
    await preencher('senha-velha', 'senha-nova-123');

    await waitFor(() => expect(session.logout).toHaveBeenCalledTimes(1));
    expect(await screen.findByTestId('login-email')).toBeOnTheScreen();
  });
});
