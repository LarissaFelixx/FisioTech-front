import { api } from '../api/client';
import type {
  EvolucaoClinica,
  EvolucaoCreateRequest,
  PlanoCreateRequest,
  PlanoTerapeutico,
} from '../types/prontuario';

/**
 * Prontuário do paciente mantido pelo profissional (`/prontuario/**`). O backend só devolve os
 * registros do profissional logado e responde 404 para paciente de outro profissional.
 */
export const prontuarioService = {
  /** `GET /prontuario/pacientes/{pacienteId}/evolucoes`: histórico, mais recentes primeiro */
  async listarEvolucoes(pacienteId: number): Promise<EvolucaoClinica[]> {
    const { data } = await api.get<EvolucaoClinica[]>(
      `/prontuario/pacientes/${pacienteId}/evolucoes`,
    );
    return data;
  },

  /** `POST /prontuario/pacientes/{pacienteId}/evolucoes` */
  async criarEvolucao(
    pacienteId: number,
    request: EvolucaoCreateRequest,
  ): Promise<EvolucaoClinica> {
    const { data } = await api.post<EvolucaoClinica>(
      `/prontuario/pacientes/${pacienteId}/evolucoes`,
      request,
    );
    return data;
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
