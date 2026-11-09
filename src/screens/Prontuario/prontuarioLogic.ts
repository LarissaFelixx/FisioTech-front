import { toApiError } from '../../api/errors';
import type { Consulta } from '../../types/consulta';
import type { EvolucaoClinica, PlanoTerapeutico } from '../../types/prontuario';
import { formatDataBr, formatHora, parseDataHora } from '../../utils/date';
import { STATUS_PLANO, periodoPlano } from '../Paciente/Tratamento/tratamentoLogic';

/** Regras do Prontuário do profissional (S5-07, Figma "P1 Prontuário"). */

export const MENSAGEM_ERRO_CARREGAR = 'Não foi possível carregar o prontuário.';
export const MENSAGEM_PACIENTE_NAO_ENCONTRADO = 'Paciente não encontrado.';
export const MENSAGEM_SEM_PLANO = 'Nenhum plano terapêutico registrado.';
export const MENSAGEM_SEM_EVOLUCOES = 'Nenhuma evolução registrada.';

/** Aviso mostrado no prontuário ao voltar de Nova Evolução ou Revisar Plano. */
export type AvisoProntuario = 'evolucao' | 'plano';

export const AVISOS: Record<AvisoProntuario, string> = {
  evolucao: 'Evolução registrada.',
  plano: 'Nova versão do plano salva.',
};

/** Selo do plano: "Ativo · v2". */
export function seloPlano(p: PlanoTerapeutico): string {
  return `${STATUS_PLANO[p.status]} · v${p.revisao}`;
}

/** "Início 12/08/2025 · Previsão 30/09/2025 · Visível ao paciente" (ou "Privado"). */
export function rodapePlano(p: PlanoTerapeutico): string {
  return `${periodoPlano(p)} · ${p.visivelPaciente ? 'Visível ao paciente' : 'Privado'}`;
}

/** Versões que não são a exibida em destaque, da mais nova para a mais antiga. */
export function versoesAnteriores(
  planos: PlanoTerapeutico[],
  atual: PlanoTerapeutico | null,
): PlanoTerapeutico[] {
  return planos.filter((p) => p.id !== atual?.id).sort((a, b) => b.revisao - a.revisao);
}

/**
 * Cabeçalho da evolução: "22/08/2025 · Consulta 09:00" quando a consulta de origem é conhecida;
 * sem ela (evolução avulsa ou consulta excluída), a data e a hora do registro.
 */
export function cabecalhoEvolucao(
  e: EvolucaoClinica,
  consultasPorId: ReadonlyMap<number, Consulta>,
): string {
  const consulta = e.consultaId != null ? consultasPorId.get(e.consultaId) : undefined;
  if (consulta) {
    const data = parseDataHora(consulta.dataHora);
    return `${formatDataBr(data)} · Consulta ${formatHora(data)}`;
  }
  const registro = parseDataHora(e.dataRegistro);
  return `${formatDataBr(registro)} · Registro ${formatHora(registro)}`;
}

export function seloEvolucao(e: EvolucaoClinica): string {
  return e.visivelPaciente ? 'Visível ao paciente' : 'Privada';
}

export function consultasPorId(consultas: Consulta[] | undefined): Map<number, Consulta> {
  return new Map((consultas ?? []).map((c) => [c.id, c]));
}

/** 404: o paciente não existe ou não é mais deste profissional; tentar de novo não resolve. */
export function pacienteNaoEncontrado(error: unknown): boolean {
  const apiError = toApiError(error);
  return apiError.kind === 'http' && apiError.status === 404;
}
