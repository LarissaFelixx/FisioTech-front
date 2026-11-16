import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { prontuarioService } from '../services/prontuarioService';
import type { PlanoCreateRequest } from '../types/plano';
import { queryKeys } from './queryKeys';

/** Revisões do plano terapêutico do paciente (`GET /prontuario/pacientes/{id}/planos`). */
export function usePlanos(pacienteId: number) {
  return useQuery({
    queryKey: queryKeys.prontuario.planos(pacienteId),
    queryFn: () => prontuarioService.listarPlanos(pacienteId),
  });
}

/** Salva uma nova revisão do plano, que substitui a ativa. */
export function useRevisarPlano() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pacienteId, request }: { pacienteId: number; request: PlanoCreateRequest }) =>
      prontuarioService.revisarPlano(pacienteId, request),
    onSuccess: (_resultado, { pacienteId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.prontuario.planos(pacienteId) }),
  });
}
