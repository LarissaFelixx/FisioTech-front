import { api, publicApi } from '../api/client';
import type {
  Paciente,
  PacienteAdminUpdateRequest,
  PacienteCreateRequest,
  PacienteUpdateRequest,
} from '../types/paciente';

const ROTA_PACIENTES = '/pacientes';
const ROTA_ADMIN_PACIENTES = '/admin/pacientes';

/** Origem: `core/pacientes/paciente.service.ts` (rotas do profissional). */
export const pacienteService = {
  /** `GET /pacientes` */
  async listarTodos(): Promise<Paciente[]> {
    const { data } = await api.get<Paciente[]>(ROTA_PACIENTES);
    return data;
  },

  /** `GET /pacientes/{id}` */
  async buscarPorId(id: number): Promise<Paciente> {
    const { data } = await api.get<Paciente>(`${ROTA_PACIENTES}/${id}`);
    return data;
  },

  /** `POST /pacientes`: cadastro da tela de Novo Paciente (#16), com nome, e-mail e senha. */
  async criar(dados: PacienteCreateRequest): Promise<void> {
    await api.post(ROTA_PACIENTES, dados);
  },

  /** `POST /pacientes/cadastro` (público, sem Bearer). */
  async cadastrarPublico(dados: PacienteCreateRequest): Promise<void> {
    await publicApi.post(`${ROTA_PACIENTES}/cadastro`, dados);
  },

  /** `PUT /pacientes/{id}` */
  async atualizar(id: number, dados: PacienteUpdateRequest): Promise<void> {
    await api.put(`${ROTA_PACIENTES}/${id}`, dados);
  },

  /** `DELETE /pacientes/{id}` */
  async deletar(id: number): Promise<void> {
    await api.delete(`${ROTA_PACIENTES}/${id}`);
  },
};

/** Origem: `core/pacientes/paciente-admin.service.ts` (rotas do admin). */
export const pacienteAdminService = {
  /** `GET /admin/pacientes` */
  async listarTodos(): Promise<Paciente[]> {
    const { data } = await api.get<Paciente[]>(ROTA_ADMIN_PACIENTES);
    return data;
  },

  /** `GET /admin/pacientes/{id}` */
  async buscarPorId(id: number): Promise<Paciente> {
    const { data } = await api.get<Paciente>(`${ROTA_ADMIN_PACIENTES}/${id}`);
    return data;
  },

  /** `PUT /admin/pacientes/{id}` */
  async atualizar(id: number, dados: PacienteAdminUpdateRequest): Promise<void> {
    await api.put(`${ROTA_ADMIN_PACIENTES}/${id}`, dados);
  },
};