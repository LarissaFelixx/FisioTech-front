import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { SessionExpiredError, type Session } from '../api/session';
import { useAuth } from '../hooks/useAuth';
import {
  createTestQueryClient,
  fakeClient,
  httpError,
  networkError,
  Providers,
} from '../test/helpers';
import type { CurrentUser } from '../types/auth';
import { AuthProvider, CadastroSemLoginError, type AuthDependencies } from './AuthContext';

const profissional: CurrentUser = {
  id: 1,
  nome: 'Dra. Ana Lima',
  email: 'ana@clinica.com',
  role: 'ROLE_PROFISSIONAL',
};

function fakeSession(overrides: Partial<Session> = {}): Session {
  return {
    login: jest.fn(async () => undefined),
    refresh: jest.fn(async () => 'access'),
    logout: jest.fn(async () => undefined),
    clearLocal: jest.fn(async () => undefined),
    getAccessToken: () => null,
    hasStoredSession: jest.fn(async () => false),
    ...overrides,
  };
}

async function renderAuth(deps: Partial<AuthDependencies>) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Providers queryClient={queryClient}>
      <AuthProvider
        dependencies={{
          client: fakeClient(() => ({ status: 200 })),
          fetchMe: jest.fn(async () => profissional),
          cadastrarPaciente: jest.fn(async () => undefined),
          ...deps,
        }}
      >
        {children}
      </AuthProvider>
    </Providers>
  );
  const hook = await renderHook(() => useAuth(), { wrapper });
  return { ...hook, queryClient };
}

describe('AuthProvider: restauração da sessão ao abrir o app', () => {
  it('sem sessão salva, vai para o login', async () => {
    const { result } = await renderAuth({ session: fakeSession() });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.user).toBeNull();
  });

  it('com sessão salva válida, renova o token e carrega o usuário', async () => {
    const session = fakeSession({ hasStoredSession: jest.fn(async () => true) });
    const { result } = await renderAuth({ session });

    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    expect(session.refresh).toHaveBeenCalled();
    expect(result.current.user).toEqual(profissional);
  });

  it('sessão expirada ou revogada (401): limpa os tokens e vai para o login', async () => {
    const session = fakeSession({
      hasStoredSession: jest.fn(async () => true),
      refresh: jest.fn(async () => {
        throw new SessionExpiredError();
      }),
    });
    const { result } = await renderAuth({ session });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(session.clearLocal).toHaveBeenCalled();
  });

  it('401 no /auth/me também desloga', async () => {
    const session = fakeSession({ hasStoredSession: jest.fn(async () => true) });
    const { result } = await renderAuth({
      session,
      fetchMe: jest.fn(async () => {
        throw httpError(401);
      }),
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));
  });

  it.each([
    ['falha de rede', networkError()],
    ['erro 500', httpError(500)],
    ['erro 403', httpError(403)],
  ])('%s NÃO desloga: mantém a sessão e permite tentar de novo', async (_nome, erro) => {
    const refresh = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(erro)
      .mockResolvedValue('access');
    const session = fakeSession({ hasStoredSession: jest.fn(async () => true), refresh });
    const { result } = await renderAuth({ session });

    await waitFor(() => expect(result.current.status).toBe('restoreFailed'));
    expect(session.clearLocal).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.restore();
    });
    expect(result.current.status).toBe('signedIn');
  });
});

describe('AuthProvider: login, cadastro e logout', () => {
  it('login autentica, carrega o usuário e muda para signedIn', async () => {
    const session = fakeSession();
    const { result } = await renderAuth({ session });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    let usuario: CurrentUser | undefined;
    await act(async () => {
      usuario = await result.current.login('ana@clinica.com', '12345678');
    });

    expect(session.login).toHaveBeenCalledWith({ email: 'ana@clinica.com', senha: '12345678' });
    expect(usuario).toEqual(profissional);
    expect(result.current.status).toBe('signedIn');
    expect(result.current.user).toEqual(profissional);
  });

  it('login com credenciais inválidas propaga o erro e continua deslogado', async () => {
    const session = fakeSession({
      login: jest.fn(async () => {
        throw httpError(401);
      }),
    });
    const { result } = await renderAuth({ session });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await expect(result.current.login('a@b.com', 'errada')).rejects.toMatchObject({
        response: { status: 401 },
      });
    });
    expect(result.current.status).toBe('signedOut');
  });

  it('se o /auth/me falhar logo após o login, descarta os tokens', async () => {
    const session = fakeSession();
    const { result } = await renderAuth({
      session,
      fetchMe: jest.fn(async () => {
        throw networkError();
      }),
    });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await expect(result.current.login('a@b.com', '12345678')).rejects.toBeDefined();
    });
    expect(session.clearLocal).toHaveBeenCalled();
    expect(result.current.status).toBe('signedOut');
  });

  it('cadastro público cria a conta e entra automaticamente', async () => {
    const paciente = { ...profissional, role: 'ROLE_PACIENTE' };
    const cadastrarPaciente = jest.fn(async () => undefined);
    const session = fakeSession();
    const { result } = await renderAuth({
      session,
      cadastrarPaciente,
      fetchMe: jest.fn(async () => paciente),
    });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await result.current.cadastrar({ nome: 'Joana', email: 'jo@x.com', senha: '12345678' });
    });

    expect(cadastrarPaciente).toHaveBeenCalledWith({
      nome: 'Joana',
      email: 'jo@x.com',
      senha: '12345678',
    });
    expect(session.login).toHaveBeenCalledWith({ email: 'jo@x.com', senha: '12345678' });
    expect(result.current.user?.role).toBe('ROLE_PACIENTE');
  });

  it('cadastro com email duplicado (409) propaga o erro sem tentar logar', async () => {
    const session = fakeSession();
    const { result } = await renderAuth({
      session,
      cadastrarPaciente: jest.fn(async () => {
        throw httpError(409);
      }),
    });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await expect(
        result.current.cadastrar({ nome: 'J', email: 'jo@x.com', senha: '12345678' }),
      ).rejects.toMatchObject({ response: { status: 409 } });
    });
    expect(session.login).not.toHaveBeenCalled();
  });

  it('conta criada mas login automático falhou: CadastroSemLoginError', async () => {
    const session = fakeSession({
      login: jest.fn(async () => {
        throw networkError();
      }),
    });
    const { result } = await renderAuth({ session });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await expect(
        result.current.cadastrar({ nome: 'J', email: 'jo@x.com', senha: '12345678' }),
      ).rejects.toBeInstanceOf(CadastroSemLoginError);
    });
  });

  it('logout encerra a sessão, limpa o cache de dados e volta para o login', async () => {
    const session = fakeSession({ hasStoredSession: jest.fn(async () => true) });
    const { result, queryClient } = await renderAuth({ session });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    queryClient.setQueryData(['consultas'], [{ id: 1 }]);

    await act(async () => {
      await result.current.logout();
    });

    expect(session.logout).toHaveBeenCalled();
    expect(result.current.status).toBe('signedOut');
    expect(result.current.user).toBeNull();
    expect(queryClient.getQueryData(['consultas'])).toBeUndefined();
  });
});

describe('AuthProvider: interceptors', () => {
  it('quando uma chamada autenticada descobre que a sessão expirou, desloga', async () => {
    const client = fakeClient(() => ({ status: 401 }));
    const session = fakeSession({
      hasStoredSession: jest.fn(async () => true),
      getAccessToken: () => 'velho',
      refresh: jest
        .fn<Promise<string>, []>()
        .mockResolvedValueOnce('access')
        .mockRejectedValue(new SessionExpiredError()),
    });
    const { result } = await renderAuth({ session, client });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));

    await act(async () => {
      await client.get('/consultas').catch(() => undefined);
    });

    expect(result.current.status).toBe('signedOut');
  });
});

describe('useAuth', () => {
  it('exige o AuthProvider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(renderHook(() => useAuth())).rejects.toThrow(/AuthProvider/);
  });
});
