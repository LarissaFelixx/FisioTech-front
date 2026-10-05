import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { meService } from '../services/meService';
import type { AvaliacaoCreateRequest } from '../types/avaliacao';
import type { ConsultaBookingRequest } from '../types/consultaBooking';
import type { MePerfilUpdateRequest } from '../types/paciente';
import { nuloSeNaoEncontrado } from './useAvaliacoes';
import { queryKeys } from './queryKeys';
import { chatQueryOptions, type ChatQueryOptions } from './useChatActivity';

/** Hooks do autoatendimento do paciente (`/me/**`, origem: `core/me/me.service.ts`). */

export function useMeuPerfil() {
  return useQuery({ queryKey: queryKeys.me.perfil(), queryFn: () => meService.perfil() });
}

export function useAtualizarMeuPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: MePerfilUpdateRequest) => meService.atualizarPerfil(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me.perfil() }),
  });
}

export function useMinhasConsultas() {
  return useQuery({
    queryKey: queryKeys.me.consultas(),
    queryFn: () => meService.minhasConsultas(),
  });
}

export function useMinhaConsulta(id: number) {
  return useQuery({
    queryKey: queryKeys.me.consulta(id),
    queryFn: () => meService.minhaConsulta(id),
  });
}

export function useCancelarConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => meService.cancelarConsulta(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me.consultas() }),
  });
}

export function useRemarcarConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, novaDataHora }: { id: number; novaDataHora: string }) =>
      meService.remarcarConsulta(id, novaDataHora),
    onSuccess: (consulta) => {
      queryClient.setQueryData(queryKeys.me.consulta(consulta.id), consulta);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.me.consultas() }),
        // O horário remarcado muda a disponibilidade do profissional.
        queryClient.invalidateQueries({ queryKey: ['me', 'disponibilidade'] }),
      ]);
    },
  });
}

export function useMarcarConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ConsultaBookingRequest) => meService.marcarConsulta(request),
    onSuccess: (consulta) => {
      queryClient.setQueryData(queryKeys.me.consulta(consulta.id), consulta);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.me.consultas() }),
        queryClient.invalidateQueries({ queryKey: ['me', 'disponibilidade'] }),
        // Marcar a primeira consulta vincula o profissional e libera a conversa com ele.
        queryClient.invalidateQueries({ queryKey: queryKeys.me.conversas() }),
      ]);
    },
  });
}

export function useMinhasConversas(options: ChatQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.me.conversas(),
    queryFn: () => meService.minhasConversas(),
    ...chatQueryOptions(options),
  });
}

export function useMinhaConversa(profissionalId: number, options: ChatQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.me.conversa(profissionalId),
    queryFn: () => meService.minhaConversa(profissionalId),
    ...chatQueryOptions(options),
  });
}

export function useEnviarMinhaMensagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profissionalId, conteudo }: { profissionalId: number; conteudo: string }) =>
      meService.enviarMensagem(profissionalId, conteudo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me.conversas() }),
  });
}

/** Avaliação que o próprio paciente deu à consulta (`null` se ainda não avaliada). */
export function useMinhaAvaliacao(consultaId: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.me.avaliacao(consultaId),
    queryFn: () => nuloSeNaoEncontrado(() => meService.minhaAvaliacao(consultaId)),
    enabled: options.enabled ?? true,
  });
}

export function useAvaliarConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: AvaliacaoCreateRequest) => meService.avaliar(request),
    onSuccess: (_resultado, request) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.me.avaliacao(request.consultaId) }),
  });
}

/**
 * Busca de profissionais para marcar consulta. No Angular a busca roda ao abrir a tela e ao
 * tocar em "Buscar"; aqui os filtros fazem parte da chave, então cada busca fica em cache.
 */
export function useBuscarProfissionais(nome?: string, especialidade?: string) {
  return useQuery({
    queryKey: queryKeys.me.profissionais(nome, especialidade),
    queryFn: () => meService.buscarProfissionais(nome, especialidade),
  });
}

export function useProfissionalPublico(
  profissionalId: number,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.me.profissional(profissionalId),
    queryFn: () => meService.buscarProfissional(profissionalId),
    enabled: options.enabled ?? true,
  });
}

/** Horários de um profissional num dia (`data` = AAAA-MM-DD); só busca com os dois definidos. */
export function useDisponibilidade(profissionalId: number | null, data: string | null) {
  return useQuery({
    queryKey: queryKeys.me.disponibilidade(profissionalId ?? 0, data ?? ''),
    queryFn: () => meService.buscarDisponibilidade(profissionalId as number, data as string),
    enabled: profissionalId != null && !!data,
  });
}
