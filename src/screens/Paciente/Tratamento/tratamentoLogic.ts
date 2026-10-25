import type { EvolucaoClinica, PlanoTerapeutico, StatusPlano } from '../../../types/prontuario';
import { formatDataBr, isoParaDataBr, parseDataHora } from '../../../utils/date';

/** Regras do Meu Tratamento (#47, Figma "T1 Meu Tratamento"). */

/**
 * Plano exibido: para cada profissional, a revisão mais recente que ele compartilhou com o
 * paciente (o backend já devolve da revisão mais nova para a mais antiga). Revisões antigas
 * substituídas não aparecem.
 */
export function planosAtuais(planos: PlanoTerapeutico[]): PlanoTerapeutico[] {
  const porProfissional = new Map<number, PlanoTerapeutico>();
  for (const p of planos) {
    const atual = porProfissional.get(p.profissionalId);
    if (!atual || p.revisao > atual.revisao) {
      porProfissional.set(p.profissionalId, p);
    }
  }
  return [...porProfissional.values()];
}

export const STATUS_PLANO: Record<StatusPlano, string> = {
  ATIVO: 'Ativo',
  SUBSTITUIDO: 'Substituído',
  ENCERRADO: 'Encerrado',
};

/** "Início 12/08/2025 · Previsão 30/09/2025" (sem previsão, só o início). */
export function periodoPlano(p: PlanoTerapeutico): string {
  const inicio = `Início ${isoParaDataBr(p.dataInicio)}`;
  return p.dataFimPrevista ? `${inicio} · Previsão ${isoParaDataBr(p.dataFimPrevista)}` : inicio;
}

/** Data da evolução (`dd/MM/yyyy`). */
export function dataEvolucao(e: EvolucaoClinica): string {
  return formatDataBr(parseDataHora(e.dataRegistro));
}

/** Linhas complementares da evolução, além das observações (só as preenchidas). */
export function detalhesEvolucao(e: EvolucaoClinica): { rotulo: string; valor: string }[] {
  return [
    { rotulo: 'Procedimentos', valor: e.procedimentos },
    { rotulo: 'Resposta', valor: e.respostaPaciente },
    { rotulo: 'Conduta', valor: e.conduta },
  ].filter((l): l is { rotulo: string; valor: string } => !!l.valor);
}

export const MENSAGEM_SEM_REGISTROS =
  'Seu fisioterapeuta ainda não compartilhou registros do tratamento com você.';
