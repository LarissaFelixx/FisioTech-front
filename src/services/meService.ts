import { api } from '../api/client';
import type { AlterarSenhaRequest } from '../types/auth';
import type { Avaliacao, AvaliacaoCreateRequest } from '../types/avaliacao';
import type { Consulta } from '../types/consulta';
import type {
  ConsultaBookingRequest,
  DisponibilidadeResponse,
  ProfissionalBusca,
} from '../types/consultaBooking';
import type { Mensagem, MinhaConversaItem } from '../types/mensagem';
import type { MePerfilUpdateRequest, Paciente } from '../types/paciente';

/** Origem: `core/me/me.service.ts`: autoatendimento do paciente logado (`/me/**`). */
export const meService = {
  /** `GET /me` */
  async perfil(): Promise<Paciente> {
    const { data } = await api.get<Paciente>('/me');
    return data;
  },

  /** `PUT /me` */
  async atualizarPerfil(request: MePerfilUpdateRequest): Promise<void> {
    await api.put('/me', request);
  },

  /** `PUT /me/senha` */
  async alterarSenha(request: AlterarSenhaRequest): Promise<void> {
    await api.put('/me/senha', request);
  },

  /** `GET /me/consultas` */
  async minhasConsultas(): Promise<Consulta[]> {
    const { data } = await api.get<Consulta[]>('/me/consultas');
    return data;
  },

  /** `GET /me/consultas/{id}` */
  async minhaConsulta(id: number): Promise<Consulta> {
    const { data } = await api.get<Consulta>(`/me/consultas/${id}`);
    return data;
  },

  /** `PUT /me/consultas/{id}/cancelar` */
  async cancelarConsulta(id: number): Promise<void> {
    await api.put(`/me/consultas/${id}/cancelar`, {});
  },

  /** `PUT /me/consultas/{id}/remarcar` (409 se o horário não estiver mais disponível) */
  async remarcarConsulta(id: number, novaDataHora: string): Promise<Consulta> {
    const { data } = await api.put<Consulta>(`/me/consultas/${id}/remarcar`, { novaDataHora });
    return data;
  },

  /** `GET /me/mensagens/caixa-entrada` */
  async minhasConversas(): Promise<MinhaConversaItem[]> {
    const { data } = await api.get<MinhaConversaItem[]>('/me/mensagens/caixa-entrada');
    return data;
  },

  /** `GET /me/mensagens/{profissionalId}` */
  async minhaConversa(profissionalId: number): Promise<Mensagem[]> {
    const { data } = await api.get<Mensagem[]>(`/me/mensagens/${profissionalId}`);
    return data;
  },

  /** `POST /me/mensagens/{profissionalId}` */
  async enviarMensagem(profissionalId: number, conteudo: string): Promise<void> {
    await api.post(`/me/mensagens/${profissionalId}`, { conteudo });
  },

  /** `POST /me/avaliacoes` */
  async avaliar(request: AvaliacaoCreateRequest): Promise<void> {
    await api.post('/me/avaliacoes', request);
  },

  /** `GET /me/avaliacoes/consulta/{consultaId}` (404 quando ainda não avaliada) */
  async minhaAvaliacao(consultaId: number): Promise<Avaliacao> {
    const { data } = await api.get<Avaliacao>(`/me/avaliacoes/consulta/${consultaId}`);
    return data;
  },

  /** `GET /me/profissionais?nome=&especialidade=` (filtros opcionais, vazios são omitidos) */
  async buscarProfissionais(nome?: string, especialidade?: string): Promise<ProfissionalBusca[]> {
    const params: Record<string, string> = {};
    if (nome) {
      params.nome = nome;
    }
    if (especialidade) {
      params.especialidade = especialidade;
    }
    const { data } = await api.get<ProfissionalBusca[]>('/me/profissionais', { params });
    return data;
  },

  /** `GET /me/profissionais/{id}` */
  async buscarProfissional(profissionalId: number): Promise<ProfissionalBusca> {
    const { data } = await api.get<ProfissionalBusca>(`/me/profissionais/${profissionalId}`);
    return data;
  },

  /** `GET /me/profissionais/{id}/disponibilidade?data=AAAA-MM-DD` */
  async buscarDisponibilidade(
    profissionalId: number,
    data: string,
  ): Promise<DisponibilidadeResponse> {
    const resposta = await api.get<DisponibilidadeResponse>(
      `/me/profissionais/${profissionalId}/disponibilidade`,
      { params: { data } },
    );
    return resposta.data;
  },

  /** `POST /me/consultas` (409 se o horário não estiver mais disponível) */
  async marcarConsulta(request: ConsultaBookingRequest): Promise<Consulta> {
    const { data } = await api.post<Consulta>('/me/consultas', request);
    return data;
  },
};
