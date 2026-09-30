import { isAxiosError } from 'axios';

/**
 * Classificação dos erros de chamada à API, usada para decidir o que fazer com cada um:
 * - `http`: o backend respondeu com status de erro (só o 401 desloga o usuário);
 * - `network`: sem resposta (servidor fora do ar, sem internet, timeout);
 * - `unknown`: qualquer outra falha (bug, request mal montada).
 */
export type ApiError =
  { kind: 'http'; status: number } | { kind: 'network' } | { kind: 'unknown'; message: string };

export function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    if (error.response) {
      return { kind: 'http', status: error.response.status };
    }
    if (error.request || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      return { kind: 'network' };
    }
    return { kind: 'unknown', message: error.message };
  }
  return { kind: 'unknown', message: error instanceof Error ? error.message : String(error) };
}

export function isUnauthorized(error: unknown): boolean {
  const apiError = toApiError(error);
  return apiError.kind === 'http' && apiError.status === 401;
}
