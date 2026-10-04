/**
 * Configuração vinda das variáveis de ambiente do Expo (`.env`, veja `.env.example`).
 * Equivale ao `environment.ts` do Angular.
 */

/** Padrão documentado no `.env.example`: backend na máquina host, visto do emulador Android. */
export const DEFAULT_API_URL = 'http://10.0.2.2:8080';

/** Normaliza a URL da API: tira espaços e barras finais, e cai no padrão se vier vazia. */
export function resolveApiUrl(raw: string | undefined): string {
  const url = (raw ?? '').trim().replace(/\/+$/, '');
  if (!url) {
    return DEFAULT_API_URL;
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(
      `EXPO_PUBLIC_API_URL inválida: "${raw}". Use uma URL http(s) completa, ex.: ${DEFAULT_API_URL}`,
    );
  }
  return url;
}

export const env = {
  // Precisa ser acessada literalmente como process.env.EXPO_PUBLIC_*,
  // senão o Expo não embute o valor no bundle.
  apiUrl: resolveApiUrl(process.env.EXPO_PUBLIC_API_URL),
} as const;
