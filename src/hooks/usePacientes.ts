import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { pacienteAdminService, pacienteService } from '../services/pacienteService';
import type {
  PacienteAdminUpdateRequest,
  PacienteCreateRequest,
  PacienteUpdateRequest,
} from '../types/paciente';
import { queryKeys } from './queryKeys';

/** Pacientes do profissional logado (`GET /pacientes`). */
export function usePacientes() {
  return useQuery({
    queryKey: queryKeys.pacientes.lista(),
    queryFn: () => pacienteService.listarTodos(),
  });
}

/** `GET /pacientes/{id}` */
export function usePaciente(id: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.pacientes.detalhe(id),
    queryFn: () => pacienteService.buscarPorId(id),
    enabled: options.enabled ?? true,
  });
}

export function useCriarPaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: PacienteCreateRequest) => pacienteService.criar(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.todos }),
  });
}

export function useAtualizarPaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: PacienteUpdateRequest }) =>
      pacienteService.atualizar(id, request),
    // O nome do paciente também aparece nas consultas.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.todos }),
        queryClient.invalidateQueries({ queryKey: queryKeys.consultas.todas }),
      ]),
  });
}

export function useDeletarPaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => pacienteService.deletar(id),
    onSuccess: (_resultado, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.pacientes.detalhe(id) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.todos }),
        queryClient.invalidateQueries({ queryKey: queryKeys.consultas.todas }),
      ]);
    },
  });
}

/** Admin: todos os pacientes (`GET /admin/pacientes`). */
export function usePacientesAdmin() {
  return useQuery({
    queryKey: queryKeys.adminPacientes.lista(),
    queryFn: () => pacienteAdminService.listarTodos(),
  });
}

/** Admin: `GET /admin/pacientes/{id}` */
export function usePacienteAdmin(id: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.adminPacientes.detalhe(id),
    queryFn: () => pacienteAdminService.buscarPorId(id),
    enabled: options.enabled ?? true,
  });
}

/** Admin: atualiza dados e o profissional responsável (`PUT /admin/pacientes/{id}`). */
export function useAtualizarPacienteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: PacienteAdminUpdateRequest }) =>
      pacienteAdminService.atualizar(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminPacientes.todos }),
  });
}
