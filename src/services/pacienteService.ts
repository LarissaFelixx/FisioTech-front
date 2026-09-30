import { api, publicApi } from '../api/client';
import type { Paciente, PacienteCreateRequest } from '../types/paciente';

/** Origem: `core/pacientes/paciente.service.ts`. O restante dos métodos entra no Batch 3. */
export const pacienteService = {
  /** `GET /pacientes` */
  async listarTodos(): Promise<Paciente[]> {
    const { data } = await api.get<Paciente[]>('/pacientes');
    return data;
  },

  /** `POST /pacientes/cadastro` (público, sem Bearer). */
  async cadastrarPublico(request: PacienteCreateRequest): Promise<void> {
    await publicApi.post('/pacientes/cadastro', request);
  },
};
