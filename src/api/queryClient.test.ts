import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';

import { createQueryClient, shouldRetry } from './queryClient';

function httpError(status: number): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data: {}, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('erro', 'ERR_BAD_RESPONSE', config, {}, response);
}

describe('shouldRetry', () => {
  it('repete falhas de rede e 5xx até 2 vezes', () => {
    const rede = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(shouldRetry(0, rede)).toBe(true);
    expect(shouldRetry(1, httpError(503))).toBe(true);
    expect(shouldRetry(2, rede)).toBe(false);
  });

  it('não repete erros 4xx nem erros desconhecidos', () => {
    expect(shouldRetry(0, httpError(401))).toBe(false);
    expect(shouldRetry(0, httpError(404))).toBe(false);
    expect(shouldRetry(0, new Error('bug'))).toBe(false);
  });
});

describe('createQueryClient', () => {
  it('usa shouldRetry nas queries e não repete mutations', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.queries?.retry).toBe(shouldRetry);
    expect(defaults.mutations?.retry).toBe(false);
  });
});
