// Origem: core/mensagens/mensagem.model.ts (Angular), copiado campo a campo; conferido com os DTOs do backend.

export type AutorMensagem = 'PROFISSIONAL' | 'PACIENTE';

export interface Mensagem {
  id: number;
  pacienteId: number;
  profissionalId: number;
  autor: AutorMensagem;
  conteudo: string;
  dataEnvio: string;
}

export interface MensagemCreateRequest {
  pacienteId: number;
  autor: AutorMensagem;
  conteudo: string;
}

export interface CaixaEntradaItem {
  pacienteId: number;
  pacienteNome: string;
  ultimaMensagem: string | null;
  ultimoAutor: AutorMensagem | null;
  dataUltimaMensagem: string | null;
}

export interface MinhaConversaItem {
  profissionalId: number;
  profissionalNome: string;
  ultimaMensagem: string | null;
  ultimoAutor: AutorMensagem | null;
  dataUltimaMensagem: string | null;
}
