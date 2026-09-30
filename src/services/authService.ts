import { api, publicApi } from '../api/client';
import { createSession } from '../api/session';
import type { CurrentUser } from '../types/auth';
import { secureTokenStorage } from './tokenStorage';

/** Sessão JWT única do app (login, refresh e logout saem pelo cliente público). */
export const session = createSession(publicApi, secureTokenStorage);

export const authService = {
  /** `GET /auth/me`: dados e papel do usuário logado. */
  async me(): Promise<CurrentUser> {
    const { data } = await api.get<CurrentUser>('/auth/me');
    return data;
  },
};
