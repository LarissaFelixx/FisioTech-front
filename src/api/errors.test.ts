import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';

import { isUnauthorized, toApiError } from './errors';

function httpError(status: number): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data: {}, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('erro', 'ERR_BAD_RESPONSE', config, {}, response);
}

describe('toApiError', () => {
  it('classifica respostas com status de erro como http', () => {
    expect(toApiError(httpError(401))).toEqual({ kind: 'http', status: 401 });
    expect(toApiError(httpError(500))).toEqual({ kind: 'http', status: 500 });
  });

  it('classifica falta de resposta e timeout como network', () => {
    expect(toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))).toEqual({
      kind: 'network',
    });
    expect(toApiError(new AxiosError('timeout', 'ECONNABORTED'))).toEqual({ kind: 'network' });
    expect(toApiError(new AxiosError('sem resposta', undefined, undefined, {}))).toEqual({
      kind: 'network',
    });
  });

  it('classifica o resto como unknown', () => {
    expect(toApiError(new Error('boom'))).toEqual({ kind: 'unknown', message: 'boom' });
    expect(toApiError('texto')).toEqual({ kind: 'unknown', message: 'texto' });
    expect(toApiError(new AxiosError('config inválida'))).toEqual({
      kind: 'unknown',
      message: 'config inválida',
    });
  });
});

describe('isUnauthorized', () => {
  it('é verdadeiro só para 401', () => {
    expect(isUnauthorized(httpError(401))).toBe(true);
    expect(isUnauthorized(httpError(403))).toBe(false);
    expect(isUnauthorized(httpError(500))).toBe(false);
    expect(isUnauthorized(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(false);
  });
});
