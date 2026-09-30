import { api } from '../api/client';
import type { Consulta } from '../types/consulta';

/** Origem: `core/consultas/consulta.service.ts`. O restante dos métodos entra no Batch 3. */
export const consultaService = {
  /** `GET /consultas?pacienteId=` */
  async listarTodos(pacienteId?: number): Promise<Consulta[]> {
    const { data } = await api.get<Consulta[]>('/consultas', {
      params: pacienteId != null ? { pacienteId } : undefined,
    });
    return data;
  },
};
