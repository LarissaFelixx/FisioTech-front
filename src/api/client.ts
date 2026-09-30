import { create, type AxiosInstance } from 'axios';

import { env } from '../config/env';

export const REQUEST_TIMEOUT_MS = 15_000;

export function createApiClient(baseURL: string): AxiosInstance {
  return create({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { Accept: 'application/json' },
  });
}

/**
 * Cliente das rotas protegidas. Os interceptors de autenticação (Bearer + renovação do token)
 * são instalados pelo AuthProvider.
 */
export const api = createApiClient(env.apiUrl);

/**
 * Cliente sem interceptors, para login, refresh, logout e cadastro público: o backend exige
 * que essas chamadas saiam sem um Bearer antigo.
 */
export const publicApi = createApiClient(env.apiUrl);
