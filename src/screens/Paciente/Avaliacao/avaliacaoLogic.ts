import { toApiError } from '../../../api/errors';
import type { Avaliacao, AvaliacaoCreateRequest } from '../../../types/avaliacao';
import type { Consulta } from '../../../types/consulta';
import { formatDataBr, formatHora, parseDataHora } from '../../../utils/date';
import { mensagemDeErro } from '../../../utils/mensagensErro';

/** Regras do Avaliar Atendimento (#43; origem: avaliação em `paciente-consulta-detail`). */

/** Limite do backend (`@Size(max = 1000)`). */
export const MAX_COMENTARIO = 1000;

/** Rótulo de cada nota; o Figma mostra "4 de 5 · Muito bom". */
export const ROTULOS_NOTA: Record<number, string> = {
  1: 'Ruim',
  2: 'Regular',
  3: 'Bom',
  4: 'Muito bom',
  5: 'Excelente',
};

/** "4 de 5 · Muito bom"; sem nota escolhida, a orientação para tocar nas estrelas. */
export function textoNota(nota: number | null): string {
  return nota ? `${nota} de 5 · ${ROTULOS_NOTA[nota]}` : 'Toque nas estrelas para dar sua nota';
}

/** "Ana Souza · 15/08/2025 15:00". */
export function subtituloAvaliacao(c: Consulta): string {
  const quando = parseDataHora(c.dataHora);
  return `${c.profissionalNome} · ${formatDataBr(quando)} ${formatHora(quando)}`;
}

/** Corpo do `POST /me/avaliacoes`: comentário em branco vira `null`, como no Angular. */
export function montarAvaliacao(
  consultaId: number,
  nota: number,
  comentario: string,
): AvaliacaoCreateRequest {
  return { consultaId, nota, comentario: comentario.trim() || null };
}

export function mensagemErroAvaliar(error: unknown): string {
  return mensagemDeErro(
    error,
    {
      409: 'Esta consulta já foi avaliada.',
      400: 'Só é possível avaliar consultas já realizadas.',
    },
    'Não foi possível enviar a avaliação.',
  );
}

/** Status do erro de envio, quando o backend respondeu (409 já avaliada, 400 não realizada). */
export function statusErroAvaliar(error: unknown): number | null {
  const erro = toApiError(error);
  return erro.kind === 'http' ? erro.status : null;
}

// ---------- Quem pode avaliar (S5-05) ----------

export type SituacaoAvaliacao = 'liberada' | 'nao-realizada' | 'ja-avaliada';

/**
 * A avaliação só é liberada para consulta REALIZADA e ainda sem avaliação; o backend recusa as
 * demais (400/409), então a tela nem mostra o formulário nesses casos.
 */
export function situacaoAvaliacao(c: Consulta, avaliacao: Avaliacao | null): SituacaoAvaliacao {
  if (c.status !== 'REALIZADA') {
    return 'nao-realizada';
  }
  return avaliacao ? 'ja-avaliada' : 'liberada';
}

export const MENSAGEM_SITUACAO: Record<Exclude<SituacaoAvaliacao, 'liberada'>, string> = {
  'nao-realizada': 'Só é possível avaliar consultas já realizadas.',
  'ja-avaliada': 'Você já avaliou esta consulta.',
};

export const MENSAGEM_ERRO_CARREGAR_AVALIACAO = 'Não foi possível carregar a consulta.';
