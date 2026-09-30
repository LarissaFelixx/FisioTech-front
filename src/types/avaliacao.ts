// Origem: core/avaliacoes/avaliacao.model.ts (Angular), copiado campo a campo; conferido com os DTOs do backend.

export interface Avaliacao {
  id: number;
  consultaId: number;
  nota: number;
  comentario: string | null;
  dataCriacao: string;
}

export interface AvaliacaoCreateRequest {
  consultaId: number;
  nota: number;
  comentario: string | null;
}
