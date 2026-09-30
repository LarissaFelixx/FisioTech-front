import { useQuery } from '@tanstack/react-query';

import { toApiError } from '../api/errors';
import { avaliacaoService } from '../services/avaliacaoService';
import type { Avaliacao } from '../types/avaliacao';
import { queryKeys } from './queryKeys';

/**
 * O backend responde 404 quando a consulta ainda não foi avaliada. O Angular tratava qualquer
 * erro como "sem avaliação"; aqui só o 404 vira `null` e os demais erros (rede, 5xx) aparecem.
 */
export async function nuloSeNaoEncontrado<T>(buscar: () => Promise<T>): Promise<T | null> {
  try {
    return await buscar();
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.kind === 'http' && apiError.status === 404) {
      return null;
    }
    throw error;
  }
}

/** Profissional: avaliação que o paciente deu à consulta (`null` se ainda não avaliada). */
export function useAvaliacaoDaConsulta(consultaId: number, options: { enabled?: boolean } = {}) {
  return useQuery<Avaliacao | null>({
    queryKey: queryKeys.avaliacoes.daConsulta(consultaId),
    queryFn: () => nuloSeNaoEncontrado(() => avaliacaoService.buscarPorConsulta(consultaId)),
    enabled: options.enabled ?? true,
  });
}
