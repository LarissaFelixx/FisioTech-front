import { REQUEST_TIMEOUT_MS, createApiClient } from './client';

describe('createApiClient', () => {
  it('configura baseURL, timeout e Accept JSON', () => {
    const client = createApiClient('http://10.0.2.2:8080');

    expect(client.defaults.baseURL).toBe('http://10.0.2.2:8080');
    expect(client.defaults.timeout).toBe(REQUEST_TIMEOUT_MS);
    expect(client.defaults.headers.Accept).toBe('application/json');
  });

  it('não envia Authorization por padrão (a credencial vem do interceptor de auth)', () => {
    const client = createApiClient('http://10.0.2.2:8080');

    expect(client.defaults.headers.common.Authorization).toBeUndefined();
  });
});
