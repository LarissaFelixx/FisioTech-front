import { useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { installAuthInterceptors } from '../api/authInterceptors';
import { api } from '../api/client';
import { isUnauthorized } from '../api/errors';
import { SessionExpiredError, type Session } from '../api/session';
import { authService, session as defaultSession } from '../services/authService';
import { pacienteService } from '../services/pacienteService';
import type { CurrentUser } from '../types/auth';
import type { PacienteCreateRequest } from '../types/paciente';

/**
 * - `restoring`: lendo a sessão salva ao abrir o app;
 * - `restoreFailed`: havia sessão salva, mas não deu para validá-la (rede/servidor). O usuário
 *   NÃO é deslogado: só um 401 desloga;
 * - `signedOut` / `signedIn`.
 */
export type AuthStatus = 'restoring' | 'restoreFailed' | 'signedOut' | 'signedIn';

/** A conta foi criada, mas o login automático falhou (a tela orienta a fazer login). */
export class CadastroSemLoginError extends Error {
  constructor(readonly causa: unknown) {
    super('Conta criada, mas não foi possível entrar automaticamente.');
    this.name = 'CadastroSemLoginError';
  }
}

export interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUser | null;
  login(email: string, senha: string): Promise<CurrentUser>;
  cadastrar(request: PacienteCreateRequest): Promise<CurrentUser>;
  logout(): Promise<void>;
  restore(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthDependencies {
  session: Session;
  client: AxiosInstance;
  fetchMe: () => Promise<CurrentUser>;
  cadastrarPaciente: (request: PacienteCreateRequest) => Promise<void>;
}

const defaultDependencies: AuthDependencies = {
  session: defaultSession,
  client: api,
  fetchMe: authService.me,
  cadastrarPaciente: pacienteService.cadastrarPublico,
};

type Props = {
  children: ReactNode;
  /** Permite injetar dependências falsas nos testes. */
  dependencies?: Partial<AuthDependencies>;
};

export function AuthProvider({ children, dependencies }: Props) {
  const queryClient = useQueryClient();
  const [deps] = useState<AuthDependencies>(() => ({ ...defaultDependencies, ...dependencies }));
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [user, setUser] = useState<CurrentUser | null>(null);

  const signOutLocally = useCallback(() => {
    setUser(null);
    setStatus('signedOut');
    queryClient.clear();
  }, [queryClient]);

  useEffect(
    () => installAuthInterceptors(deps.client, deps.session, signOutLocally),
    [deps, signOutLocally],
  );

  const restore = useCallback(async () => {
    try {
      const temSessao = await deps.session.hasStoredSession();
      if (!temSessao) {
        signOutLocally();
        return;
      }
      setStatus('restoring');
      await deps.session.refresh();
      const me = await deps.fetchMe();
      setUser(me);
      setStatus('signedIn');
    } catch (error) {
      if (error instanceof SessionExpiredError || isUnauthorized(error)) {
        await deps.session.clearLocal();
        signOutLocally();
      } else {
        setStatus('restoreFailed');
      }
    }
  }, [deps, signOutLocally]);

  useEffect(() => {
    // As atualizações de estado de `restore` só acontecem depois de um `await` (leitura do
    // armazenamento seguro), não de forma síncrona dentro do efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restore();
  }, [restore]);

  const login = useCallback(
    async (email: string, senha: string) => {
      await deps.session.login({ email, senha });
      let me: CurrentUser;
      try {
        me = await deps.fetchMe();
      } catch (error) {
        await deps.session.clearLocal();
        throw error;
      }
      queryClient.clear();
      setUser(me);
      setStatus('signedIn');
      return me;
    },
    [deps, queryClient],
  );

  const cadastrar = useCallback(
    async (request: PacienteCreateRequest) => {
      await deps.cadastrarPaciente(request);
      try {
        return await login(request.email, request.senha);
      } catch (error) {
        throw new CadastroSemLoginError(error);
      }
    },
    [deps, login],
  );

  const logout = useCallback(async () => {
    await deps.session.logout();
    signOutLocally();
  }, [deps, signOutLocally]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, cadastrar, logout, restore }),
    [status, user, login, cadastrar, logout, restore],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
