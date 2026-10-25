import { useMutation, useQueryClient } from '@tanstack/react-query';

import { prontuarioService } from '../services/prontuarioService';
import type { EvolucaoCreateRequest } from '../types/evolucao';
import { queryKeys } from './queryKeys';

/** Registra uma evolução no prontuário do paciente. */
export function useCriarEvolucao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pacienteId, request }: { pacienteId: number; request: EvolucaoCreateRequest }) =>
      prontuarioService.criarEvolucao(pacienteId, request),
    onSuccess: (_resultado, { pacienteId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.prontuario.evolucoes(pacienteId) }),
  });
}
