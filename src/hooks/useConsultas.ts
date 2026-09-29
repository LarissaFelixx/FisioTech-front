import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { consultaService } from '../services/consultaService';
import type { ConsultaCreateRequest, ConsultaUpdateRequest } from '../types/consulta';
import { queryKeys } from './queryKeys';

/** Consultas do profissional logado, opcionalmente de um paciente (`GET /consultas`). */
export function useConsultas(pacienteId?: number) {
  return useQuery({
    queryKey: queryKeys.consultas.lista(pacienteId),
    queryFn: () => consultaService.listarTodos(pacienteId),
  });
}

/** `GET /consultas/{id}` */
export function useConsulta(id: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.consultas.detalhe(id),
    queryFn: () => consultaService.buscarPorId(id),
    enabled: options.enabled ?? true,
  });
}

/** Cria a consulta e devolve o id dela (lido do header `Location`). */
export function useCriarConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ConsultaCreateRequest) => consultaService.criar(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.consultas.todas }),
  });
}

export function useAtualizarConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: ConsultaUpdateRequest }) =>
      consultaService.atualizar(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.consultas.todas }),
  });
}

export function useDeletarConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => consultaService.deletar(id),
    onSuccess: (_resultado, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.consultas.detalhe(id) });
      return queryClient.invalidateQueries({ queryKey: queryKeys.consultas.todas });
    },
  });
}
