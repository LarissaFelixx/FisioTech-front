import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'fisiotech.auth.refreshToken';

/**
 * Persistência do refresh token no armazenamento seguro do aparelho (Keystore no Android).
 * O access token fica só em memória, e a senha nunca é salva.
 */
export interface TokenStorage {
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clear(): Promise<void>;
}

export const secureTokenStorage: TokenStorage = {
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
};
