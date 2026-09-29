import { api } from '../api/client';
import { idDoLocation } from '../api/location';
import type { Consulta, ConsultaCreateRequest, ConsultaUpdateRequest } from '../types/consulta';

/** Origem: `core/consultas/consulta.service.ts`. */
export const consultaService = {
  /** `GET /consultas?pacienteId=` */
  async listarTodos(pacienteId?: number): Promise<Consulta[]> {
    const { data } = await api.get<Consulta[]>('/consultas', {
      params: pacienteId != null ? { pacienteId } : undefined,
    });
    return data;
  },

  /** `GET /consultas/{id}` */
  async buscarPorId(id: number): Promise<Consulta> {
    const { data } = await api.get<Consulta>(`/consultas/${id}`);
    return data;
  },

  /** `POST /consultas`: devolve o id da consulta criada, lido do header `Location`. */
  async criar(request: ConsultaCreateRequest): Promise<number> {
    const { headers } = await api.post('/consultas', request);
    return idDoLocation(headers.location as string | undefined);
  },

  /** `PUT /consultas/{id}` */
  async atualizar(id: number, request: ConsultaUpdateRequest): Promise<void> {
    await api.put(`/consultas/${id}`, request);
  },

  /** `DELETE /consultas/{id}` */
  async deletar(id: number): Promise<void> {
    await api.delete(`/consultas/${id}`);
  },
};
