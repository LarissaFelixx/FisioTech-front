import { fakeClient, memoryStorage, networkError } from '../test/helpers';
import { SessionExpiredError, createSession } from './session';

const tokens = (n: number) => ({
  accessToken: `access-${n}`,
  tokenType: 'Bearer',
  expiresIn: 900,
  refreshToken: `refresh-${n}`,
  refreshExpiresIn: 604800,
});

describe('createSession', () => {
  it('login envia email/senha, guarda o refresh token e mantém o access token só em memória', async () => {
    const client = fakeClient(() => ({ status: 200, data: tokens(1) }));
    const storage = memoryStorage();
    const session = createSession(client, storage);

    await session.login({ email: 'ana@clinica.com', senha: '12345678' });

    expect(client.calls[0].url).toBe('/auth/login');
    expect(JSON.parse(client.calls[0].data)).toEqual({
      email: 'ana@clinica.com',
      senha: '12345678',
    });
    expect(client.calls[0].headers.Authorization).toBeUndefined();
    expect(storage.value).toBe('refresh-1');
    expect(session.getAccessToken()).toBe('access-1');
    expect(await session.hasStoredSession()).toBe(true);
  });

  it('login com credenciais inválidas não salva nada', async () => {
    const storage = memoryStorage();
    const session = createSession(
      fakeClient(() => ({ status: 401 })),
      storage,
    );

    await expect(session.login({ email: 'a@b.com', senha: 'x' })).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(storage.setRefreshToken).not.toHaveBeenCalled();
    expect(session.getAccessToken()).toBeNull();
  });

  it('refresh troca o refresh token (rotação) e salva o novo antes de devolvê-lo', async () => {
    const client = fakeClient(() => ({ status: 200, data: tokens(2) }));
    const storage = memoryStorage('refresh-1');
    const session = createSession(client, storage);

    await expect(session.refresh()).resolves.toBe('access-2');
    expect(JSON.parse(client.calls[0].data)).toEqual({ refreshToken: 'refresh-1' });
    expect(storage.value).toBe('refresh-2');
    expect(session.getAccessToken()).toBe('access-2');
  });

  it('renovações simultâneas compartilham uma única chamada ao servidor', async () => {
    let n = 1;
    const client = fakeClient(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return { status: 200, data: tokens(++n) };
    });
    const session = createSession(client, memoryStorage('refresh-1'));

    const resultados = await Promise.all([session.refresh(), session.refresh(), session.refresh()]);

    expect(client.calls).toHaveLength(1);
    expect(resultados).toEqual(['access-2', 'access-2', 'access-2']);
    // Depois de terminar, uma nova renovação volta a chamar o servidor.
    await session.refresh();
    expect(client.calls).toHaveLength(2);
  });

  it('refresh com 401 apaga os tokens locais e sinaliza sessão expirada', async () => {
    const storage = memoryStorage('refresh-1');
    const session = createSession(
      fakeClient(() => ({ status: 401 })),
      storage,
    );

    await expect(session.refresh()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(storage.value).toBeNull();
  });

  it('refresh sem token salvo sinaliza sessão expirada sem chamar o servidor', async () => {
    const client = fakeClient(() => ({ status: 200, data: tokens(1) }));
    const session = createSession(client, memoryStorage(null));

    await expect(session.refresh()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(client.calls).toHaveLength(0);
  });

  it('refresh com erro de rede ou 5xx mantém o token para nova tentativa', async () => {
    const storage = memoryStorage('refresh-1');
    const semRede = createSession(
      fakeClient(() => {
        throw networkError();
      }),
      storage,
    );
    await expect(semRede.refresh()).rejects.toMatchObject({ code: 'ERR_NETWORK' });
    expect(storage.value).toBe('refresh-1');

    const erroServidor = createSession(
      fakeClient(() => ({ status: 503 })),
      storage,
    );
    await expect(erroServidor.refresh()).rejects.not.toBeInstanceOf(SessionExpiredError);
    expect(storage.value).toBe('refresh-1');
  });

  it('logout revoga no servidor e limpa os tokens locais', async () => {
    const client = fakeClient(() => ({ status: 204 }));
    const storage = memoryStorage('refresh-1');
    const session = createSession(client, storage);

    await session.logout();

    expect(client.calls[0].url).toBe('/auth/logout');
    expect(JSON.parse(client.calls[0].data)).toEqual({ refreshToken: 'refresh-1' });
    expect(storage.value).toBeNull();
    expect(session.getAccessToken()).toBeNull();
  });

  it('logout offline ainda desloga localmente', async () => {
    const storage = memoryStorage('refresh-1');
    const session = createSession(
      fakeClient(() => {
        throw networkError();
      }),
      storage,
    );

    await expect(session.logout()).resolves.toBeUndefined();
    expect(storage.value).toBeNull();
  });
});
