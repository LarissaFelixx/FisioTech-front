import { api } from '../api/client';
import type { AlterarSenhaRequest } from '../types/auth';
import type {
  Profissional,
  ProfissionalCreateRequest,
  ProfissionalUpdateRequest,
} from '../types/profissional';

/**
 * Origem: `core/profissionais/profissional.service.ts`. O CRUD é usado pelo admin; a troca da
 * própria senha, pelo profissional.
 */
export const profissionalService = {
  /** `GET /profissionais` */
  async listarTodos(): Promise<Profissional[]> {
    const { data } = await api.get<Profissional[]>('/profissionais');
    return data;
  },

  /** `GET /profissionais/{id}` */
  async buscarPorId(id: number): Promise<Profissional> {
    const { data } = await api.get<Profissional>(`/profissionais/${id}`);
    return data;
  },

  /** `POST /profissionais` */
  async criar(request: ProfissionalCreateRequest): Promise<void> {
    await api.post('/profissionais', request);
  },

  /** `PUT /profissionais/{id}` */
  async atualizar(id: number, request: ProfissionalUpdateRequest): Promise<void> {
    await api.put(`/profissionais/${id}`, request);
  },

  /** `DELETE /profissionais/{id}` */
  async deletar(id: number): Promise<void> {
    await api.delete(`/profissionais/${id}`);
  },

  /** `PUT /profissionais/me/senha` */
  async alterarPropriaSenha(request: AlterarSenhaRequest): Promise<void> {
    await api.put('/profissionais/me/senha', request);
  },
};

/** Origem: `core/admin/admin.service.ts`. */
export const adminService = {
  /** `PUT /admin/me/senha` */
  async alterarPropriaSenha(request: AlterarSenhaRequest): Promise<void> {
    await api.put('/admin/me/senha', request);
  },
};
