import { fakeClient } from '../test/helpers';
import { installAuthInterceptors } from './authInterceptors';
import { SessionExpiredError, type Session } from './session';

function fakeSession(accessToken: string | null, refresh: () => Promise<string>): Session {
  let token = accessToken;
  return {
    login: jest.fn(),
    refresh: jest.fn(async () => {
      token = await refresh();
      return token;
    }),
    logout: jest.fn(),
    clearLocal: jest.fn(),
    getAccessToken: () => token,
    hasStoredSession: jest.fn(),
  };
}

describe('installAuthInterceptors', () => {
  it('anexa o Bearer quando há access token', async () => {
    const client = fakeClient(() => ({ status: 200, data: [] }));
    installAuthInterceptors(client, fakeSession('abc', jest.fn()), jest.fn());

    await client.get('/consultas');

    expect(client.calls[0].headers.Authorization).toBe('Bearer abc');
  });

  it('não anexa header sem access token', async () => {
    const client = fakeClient(() => ({ status: 200 }));
    installAuthInterceptors(client, fakeSession(null, jest.fn()), jest.fn());

    await client.get('/consultas');

    expect(client.calls[0].headers.Authorization).toBeUndefined();
  });

  it('não sobrescreve um Authorization definido pela própria chamada', async () => {
    const client = fakeClient(() => ({ status: 200 }));
    installAuthInterceptors(client, fakeSession('abc', jest.fn()), jest.fn());

    await client.get('/x', { headers: { Authorization: 'Bearer outro' } });

    expect(client.calls[0].headers.Authorization).toBe('Bearer outro');
  });

  it('num 401 renova o token e repete a requisição uma vez com o novo Bearer', async () => {
    const client = fakeClient((config) =>
      config.headers.Authorization === 'Bearer novo'
        ? { status: 200, data: 'ok' }
        : { status: 401 },
    );
    const session = fakeSession('velho', async () => 'novo');
    const onExpired = jest.fn();
    installAuthInterceptors(client, session, onExpired);

    const { data } = await client.get('/consultas');

    expect(data).toBe('ok');
    expect(session.refresh).toHaveBeenCalledTimes(1);
    expect(client.calls.map((c) => c.headers.Authorization)).toEqual([
      'Bearer velho',
      'Bearer novo',
    ]);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('não entra em loop: se a repetição também der 401, desiste', async () => {
    const client = fakeClient(() => ({ status: 401 }));
    const session = fakeSession('velho', async () => 'novo');
    installAuthInterceptors(client, session, jest.fn());

    await expect(client.get('/consultas')).rejects.toMatchObject({ response: { status: 401 } });
    expect(session.refresh).toHaveBeenCalledTimes(1);
    expect(client.calls).toHaveLength(2);
  });

  it('se a sessão expirou, avisa (logout) e rejeita com o 401 original', async () => {
    const client = fakeClient(() => ({ status: 401 }));
    const onExpired = jest.fn();
    installAuthInterceptors(
      client,
      fakeSession('velho', async () => {
        throw new SessionExpiredError();
      }),
      onExpired,
    );

    await expect(client.get('/consultas')).rejects.toMatchObject({ response: { status: 401 } });
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('falha de rede na renovação não desloga', async () => {
    const client = fakeClient(() => ({ status: 401 }));
    const onExpired = jest.fn();
    const falhaRede = new Error('Network Error');
    installAuthInterceptors(
      client,
      fakeSession('velho', async () => {
        throw falhaRede;
      }),
      onExpired,
    );

    await expect(client.get('/consultas')).rejects.toBe(falhaRede);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('erros que não são 401 passam direto, sem renovar', async () => {
    const client = fakeClient(() => ({ status: 500 }));
    const session = fakeSession('abc', async () => 'novo');
    installAuthInterceptors(client, session, jest.fn());

    await expect(client.get('/consultas')).rejects.toMatchObject({ response: { status: 500 } });
    expect(session.refresh).not.toHaveBeenCalled();
  });

  it('a função retornada remove os interceptors', async () => {
    const client = fakeClient(() => ({ status: 200 }));
    const remover = installAuthInterceptors(client, fakeSession('abc', jest.fn()), jest.fn());
    remover();

    await client.get('/x');

    expect(client.calls[0].headers.Authorization).toBeUndefined();
  });
});
