import { api } from '../api/client';
import type { EvolucaoCreateRequest } from '../types/evolucao';
import type { PlanoCreateRequest, PlanoTerapeutico } from '../types/plano';

/** Prontuário do paciente mantido pelo profissional (`/prontuario/**`). */
export const prontuarioService = {
  /** `POST /prontuario/pacientes/{pacienteId}/evolucoes` */
  async criarEvolucao(pacienteId: number, request: EvolucaoCreateRequest): Promise<void> {
    await api.post(`/prontuario/pacientes/${pacienteId}/evolucoes`, request);
  },

  /** `GET /prontuario/pacientes/{pacienteId}/planos`: revisões, da mais nova para a mais antiga */
  async listarPlanos(pacienteId: number): Promise<PlanoTerapeutico[]> {
    const { data } = await api.get<PlanoTerapeutico[]>(
      `/prontuario/pacientes/${pacienteId}/planos`,
    );
    return data;
  },

  /** `POST /prontuario/pacientes/{pacienteId}/planos`: nova revisão; a ativa vira SUBSTITUIDO */
  async revisarPlano(pacienteId: number, request: PlanoCreateRequest): Promise<PlanoTerapeutico> {
    const { data } = await api.post<PlanoTerapeutico>(
      `/prontuario/pacientes/${pacienteId}/planos`,
      request,
    );
    return data;
  },
};
