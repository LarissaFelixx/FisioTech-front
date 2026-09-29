import { create, type AxiosInstance } from 'axios';

import { env } from '../config/env';

export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Cria o cliente HTTP da API. O interceptor que injeta a credencial
 * (equivalente ao `authInterceptor` do Angular) é registrado pelo AuthContext.
 */
export function createApiClient(baseURL: string): AxiosInstance {
  return create({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { Accept: 'application/json' },
  });
}

export const api = createApiClient(env.apiUrl);
