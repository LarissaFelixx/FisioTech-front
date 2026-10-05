import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { mensagemService } from '../services/mensagemService';
import type { MensagemCreateRequest } from '../types/mensagem';
import { queryKeys } from './queryKeys';
import { chatQueryOptions, type ChatQueryOptions } from './useChatActivity';

/** Profissional: caixa de entrada (`GET /mensagens/caixa-entrada`). */
export function useCaixaEntrada(options: ChatQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.mensagens.caixaEntrada(),
    queryFn: () => mensagemService.caixaEntrada(),
    ...chatQueryOptions(options),
  });
}

/** Profissional: conversa com um paciente (`GET /mensagens?pacienteId=`). */
export function useConversaComPaciente(pacienteId: number, options: ChatQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.mensagens.conversa(pacienteId),
    queryFn: () => mensagemService.listarPorPaciente(pacienteId),
    ...chatQueryOptions(options),
  });
}

/** Profissional: `POST /mensagens`; atualiza a conversa e a caixa de entrada. */
export function useEnviarMensagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: MensagemCreateRequest) => mensagemService.enviar(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.mensagens.todas }),
  });
}
