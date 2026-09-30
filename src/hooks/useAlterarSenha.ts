import { useMutation } from '@tanstack/react-query';

import { meService } from '../services/meService';
import { adminService, profissionalService } from '../services/profissionalService';
import { ROLES, type AlterarSenhaRequest } from '../types/auth';
import { useAuth } from './useAuth';

const ENDPOINT_POR_PERFIL: Record<string, (request: AlterarSenhaRequest) => Promise<void>> = {
  [ROLES.profissional]: profissionalService.alterarPropriaSenha,
  [ROLES.paciente]: meService.alterarSenha,
  [ROLES.admin]: adminService.alterarPropriaSenha,
};

export type ResultadoTrocaSenha = 'relogado' | 'deslogado';

/**
 * Troca a própria senha (origem: `profissional-senha`, `paciente-senha` e `admin-senha` do Angular).
 * O backend revoga todas as sessões da conta ao trocar a senha, então, como no Angular, o app
 * entra de novo com a nova senha. Se esse novo login falhar, desloga (`'deslogado'`).
 * Erros da troca em si (ex.: 400 "senha atual incorreta") são propagados.
 */
export function useAlterarSenha() {
  const { user, login, logout } = useAuth();

  return useMutation({
    mutationFn: async (request: AlterarSenhaRequest): Promise<ResultadoTrocaSenha> => {
      const alterar = user ? ENDPOINT_POR_PERFIL[user.role] : undefined;
      if (!user || !alterar) {
        throw new Error('Perfil sem troca de senha disponível.');
      }
      await alterar(request);
      try {
        await login(user.email, request.novaSenha);
        return 'relogado';
      } catch {
        await logout();
        return 'deslogado';
      }
    },
  });
}
