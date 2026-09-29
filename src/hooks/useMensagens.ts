import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { mensagemService } from '../services/mensagemService';
import type { MensagemCreateRequest } from '../types/mensagem';
import { queryKeys } from './queryKeys';

/** Profissional: caixa de entrada (`GET /mensagens/caixa-entrada`). */
export function useCaixaEntrada() {
  return useQuery({
    queryKey: queryKeys.mensagens.caixaEntrada(),
    queryFn: () => mensagemService.caixaEntrada(),
  });
}

/** Profissional: conversa com um paciente (`GET /mensagens?pacienteId=`). */
export function useConversaComPaciente(pacienteId: number) {
  return useQuery({
    queryKey: queryKeys.mensagens.conversa(pacienteId),
    queryFn: () => mensagemService.listarPorPaciente(pacienteId),
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
