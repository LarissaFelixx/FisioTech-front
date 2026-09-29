import { QueryClient } from '@tanstack/react-query';

import { toApiError } from './errors';

const MAX_RETRIES = 2;

/** Só vale a pena repetir falhas de rede ou 5xx; erros 4xx não mudam numa nova tentativa. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) {
    return false;
  }
  const apiError = toApiError(error);
  return apiError.kind === 'network' || (apiError.kind === 'http' && apiError.status >= 500);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}
