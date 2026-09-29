import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { isUnauthorized } from './errors';
import { SessionExpiredError, type Session } from './session';

type RetriableConfig = InternalAxiosRequestConfig & { _authRetry?: boolean };

/**
 * Equivalente ao `authInterceptor` do Angular, adaptado ao JWT:
 * - injeta `Authorization: Bearer <access token>` (sem sobrescrever um header já definido);
 * - num 401, renova o token uma única vez e repete a requisição;
 * - se a renovação disser que a sessão acabou, chama `onSessionExpired` (logout).
 * Retorna uma função que remove os interceptors.
 */
export function installAuthInterceptors(
  client: AxiosInstance,
  session: Session,
  onSessionExpired: () => void,
): () => void {
  const requestId = client.interceptors.request.use((config) => {
    const token = session.getAccessToken();
    if (token && !config.headers.has('Authorization')) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  const responseId = client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (!config || !isUnauthorized(error) || config._authRetry) {
      throw error;
    }
    config._authRetry = true;

    let token: string;
    try {
      token = await session.refresh();
    } catch (refreshError) {
      if (refreshError instanceof SessionExpiredError) {
        onSessionExpired();
        throw error;
      }
      throw refreshError;
    }

    config.headers.set('Authorization', `Bearer ${token}`);
    return client.request(config);
  });

  return () => {
    client.interceptors.request.eject(requestId);
    client.interceptors.response.eject(responseId);
  };
}
