import { api } from '../api/client';
import type { Avaliacao, AvaliacaoCreateRequest } from '../types/avaliacao';

/** Origem: `core/avaliacoes/avaliacao.service.ts` (lado do profissional). */
export const avaliacaoService = {
  /** `GET /avaliacoes/consulta/{consultaId}` (404 quando a consulta ainda não foi avaliada) */
  async buscarPorConsulta(consultaId: number): Promise<Avaliacao> {
    const { data } = await api.get<Avaliacao>(`/avaliacoes/consulta/${consultaId}`);
    return data;
  },

  /** `POST /avaliacoes` */
  async criar(request: AvaliacaoCreateRequest): Promise<void> {
    await api.post('/avaliacoes', request);
  },
};
