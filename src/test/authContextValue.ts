import type { AuthContextValue } from '../contexts/AuthContext';
import type { CurrentUser } from '../types/auth';

export const usuarioProfissional: CurrentUser = {
  id: 1,
  nome: 'Dra. Ana Lima',
  email: 'ana@clinica.com',
  role: 'ROLE_PROFISSIONAL',
};

/** Valor falso do AuthContext para testar telas isoladamente. */
export function authValue(parcial: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'signedIn',
    user: usuarioProfissional,
    login: jest.fn(async () => usuarioProfissional),
    cadastrar: jest.fn(async () => usuarioProfissional),
    logout: jest.fn(async () => undefined),
    restore: jest.fn(async () => undefined),
    ...parcial,
  };
}
