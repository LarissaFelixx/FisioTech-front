import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { prontuarioService } from '../services/prontuarioService';
import type { EvolucaoCreateRequest } from '../types/prontuario';
import { queryKeys } from './queryKeys';

/** Histórico de evoluções do paciente (`GET /prontuario/pacientes/{id}/evolucoes`). */
export function useEvolucoes(pacienteId: number) {
  return useQuery({
    queryKey: queryKeys.prontuario.evolucoes(pacienteId),
    queryFn: () => prontuarioService.listarEvolucoes(pacienteId),
  });
}

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
