import { api, publicApi } from '../api/client';
import type {
  Paciente,
  PacienteAdminUpdateRequest,
  PacienteCreateRequest,
  PacienteUpdateRequest,
} from '../types/paciente';

/** Origem: `core/pacientes/paciente.service.ts` (rotas do profissional). */
export const pacienteService = {
  /** `GET /pacientes` */
  async listarTodos(): Promise<Paciente[]> {
    const { data } = await api.get<Paciente[]>('/pacientes');
    return data;
  },

  /** `GET /pacientes/{id}` */
  async buscarPorId(id: number): Promise<Paciente> {
    const { data } = await api.get<Paciente>(`/pacientes/${id}`);
    return data;
  },

  /** `POST /pacientes` */
  async criar(request: PacienteCreateRequest): Promise<void> {
    await api.post('/pacientes', request);
  },

  /** `POST /pacientes/cadastro` (público, sem Bearer). */
  async cadastrarPublico(request: PacienteCreateRequest): Promise<void> {
    await publicApi.post('/pacientes/cadastro', request);
  },

  /** `PUT /pacientes/{id}` */
  async atualizar(id: number, request: PacienteUpdateRequest): Promise<void> {
    await api.put(`/pacientes/${id}`, request);
  },

  /** `DELETE /pacientes/{id}` */
  async deletar(id: number): Promise<void> {
    await api.delete(`/pacientes/${id}`);
  },
};

/** Origem: `core/pacientes/paciente-admin.service.ts` (rotas do admin). */
export const pacienteAdminService = {
  /** `GET /admin/pacientes` */
  async listarTodos(): Promise<Paciente[]> {
    const { data } = await api.get<Paciente[]>('/admin/pacientes');
    return data;
  },

  /** `GET /admin/pacientes/{id}` */
  async buscarPorId(id: number): Promise<Paciente> {
    const { data } = await api.get<Paciente>(`/admin/pacientes/${id}`);
    return data;
  },

  /** `PUT /admin/pacientes/{id}` */
  async atualizar(id: number, request: PacienteAdminUpdateRequest): Promise<void> {
    await api.put(`/admin/pacientes/${id}`, request);
  },
};
