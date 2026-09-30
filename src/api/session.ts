import type { AxiosInstance } from 'axios';

import type { TokenStorage } from '../services/tokenStorage';
import type { LoginRequest, TokenResponse } from '../types/auth';
import { isUnauthorized } from './errors';

/** A sessão não pode mais ser renovada (refresh ausente, expirado ou revogado): exige novo login. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Sessão expirada.');
    this.name = 'SessionExpiredError';
  }
}

export interface Session {
  login(credenciais: LoginRequest): Promise<void>;
  /** Renova o access token. Chamadas simultâneas compartilham a mesma renovação. */
  refresh(): Promise<string>;
  logout(): Promise<void>;
  /** Apaga os tokens locais sem chamar o servidor. */
  clearLocal(): Promise<void>;
  getAccessToken(): string | null;
  hasStoredSession(): Promise<boolean>;
}

/**
 * Sessão JWT seguindo o guia do backend (`docs/autenticacao-jwt.md`, seção "Aplicativo mobile"):
 * access token em memória, refresh token no armazenamento seguro, renovação centralizada
 * (uma por vez) e o novo refresh token salvo antes de ser usado.
 */
export function createSession(client: AxiosInstance, storage: TokenStorage): Session {
  let accessToken: string | null = null;
  let refreshing: Promise<string> | null = null;

  async function applyTokens(tokens: TokenResponse): Promise<void> {
    await storage.setRefreshToken(tokens.refreshToken);
    accessToken = tokens.accessToken;
  }

  async function clearLocal(): Promise<void> {
    accessToken = null;
    await storage.clear();
  }

  async function doRefresh(): Promise<string> {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      throw new SessionExpiredError();
    }
    try {
      const { data } = await client.post<TokenResponse>('/auth/refresh', { refreshToken });
      await applyTokens(data);
      return data.accessToken;
    } catch (error) {
      if (isUnauthorized(error)) {
        await clearLocal();
        throw new SessionExpiredError();
      }
      // Erro de rede ou do servidor: mantém o refresh token para uma nova tentativa.
      throw error;
    }
  }

  return {
    async login(credenciais) {
      const { data } = await client.post<TokenResponse>('/auth/login', credenciais);
      await applyTokens(data);
    },

    refresh() {
      refreshing ??= doRefresh().finally(() => {
        refreshing = null;
      });
      return refreshing;
    },

    async logout() {
      const refreshToken = await storage.getRefreshToken();
      await clearLocal();
      if (refreshToken) {
        // Revoga a sessão no servidor. Offline, a limpeza local já desloga o app.
        await client.post('/auth/logout', { refreshToken }).catch(() => undefined);
      }
    },

    clearLocal,

    getAccessToken: () => accessToken,

    async hasStoredSession() {
      return (await storage.getRefreshToken()) !== null;
    },
  };
}
