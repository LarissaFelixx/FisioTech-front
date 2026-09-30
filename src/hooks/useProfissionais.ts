import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profissionalService } from '../services/profissionalService';
import type { ProfissionalCreateRequest, ProfissionalUpdateRequest } from '../types/profissional';
import { queryKeys } from './queryKeys';

/** Admin: `GET /profissionais` (também usado no formulário de paciente do admin). */
export function useProfissionais() {
  return useQuery({
    queryKey: queryKeys.profissionais.lista(),
    queryFn: () => profissionalService.listarTodos(),
  });
}

/** Admin: `GET /profissionais/{id}` */
export function useProfissional(id: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.profissionais.detalhe(id),
    queryFn: () => profissionalService.buscarPorId(id),
    enabled: options.enabled ?? true,
  });
}

export function useCriarProfissional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ProfissionalCreateRequest) => profissionalService.criar(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profissionais.todos }),
  });
}

export function useAtualizarProfissional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: ProfissionalUpdateRequest }) =>
      profissionalService.atualizar(id, request),
    // O nome do profissional aparece na lista de pacientes do admin.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profissionais.todos }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminPacientes.todos }),
      ]),
  });
}

export function useDeletarProfissional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => profissionalService.deletar(id),
    onSuccess: (_resultado, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.profissionais.detalhe(id) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profissionais.todos }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminPacientes.todos }),
      ]);
    },
  });
}
