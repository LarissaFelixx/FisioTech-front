/** `GET /auth/me` (origem: `core/auth/current-user.ts`). */
export interface CurrentUser {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export const ROLES = {
  admin: 'ROLE_ADMIN',
  profissional: 'ROLE_PROFISSIONAL',
  paciente: 'ROLE_PACIENTE',
} as const;

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

/** `POST /auth/login` (backend com JWT). */
export interface LoginRequest {
  email: string;
  senha: string;
}

/** Resposta de `POST /auth/login` e `POST /auth/refresh`. Validades em segundos. */
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}
