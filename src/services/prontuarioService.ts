import { api } from '../api/client';
import type { EvolucaoCreateRequest } from '../types/evolucao';

/** Prontuário do paciente mantido pelo profissional (`/prontuario/**`). */
export const prontuarioService = {
  /** `POST /prontuario/pacientes/{pacienteId}/evolucoes` */
  async criarEvolucao(pacienteId: number, request: EvolucaoCreateRequest): Promise<void> {
    await api.post(`/prontuario/pacientes/${pacienteId}/evolucoes`, request);
  },
};
