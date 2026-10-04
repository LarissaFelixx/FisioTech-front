import { api } from '../api/client';
import type { CaixaEntradaItem, Mensagem, MensagemCreateRequest } from '../types/mensagem';

/** Origem: `core/mensagens/mensagem.service.ts` (lado do profissional). */
export const mensagemService = {
  /** `GET /mensagens?pacienteId=` */
  async listarPorPaciente(pacienteId: number): Promise<Mensagem[]> {
    const { data } = await api.get<Mensagem[]>('/mensagens', { params: { pacienteId } });
    return data;
  },

  /** `POST /mensagens` */
  async enviar(request: MensagemCreateRequest): Promise<void> {
    await api.post('/mensagens', request);
  },

  /** `GET /mensagens/caixa-entrada` */
  async caixaEntrada(): Promise<CaixaEntradaItem[]> {
    const { data } = await api.get<CaixaEntradaItem[]>('/mensagens/caixa-entrada');
    return data;
  },
};
