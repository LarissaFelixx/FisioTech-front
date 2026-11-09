import type { Consulta } from '../../../types/consulta';
import { formatDataHoraBr, parseDataHora } from '../../../utils/date';

/**
 * Regras de "Minhas Consultas" (#39; origem: `features/paciente/paciente-consulta-list` do
 * Angular), como funções puras.
 */

/** Mais recentes primeiro, como no Figma (a futura no topo, a mais antiga no fim). */
export function ordenarConsultas(consultas: Consulta[]): Consulta[] {
  return [...consultas].sort((a, b) => b.dataHora.localeCompare(a.dataHora));
}

/** Linha do Figma: "22/08/2025 09:00 · Presencial", com o convênio embaixo (se houver). */
export function linhaConsulta(c: Consulta) {
  return {
    quando: `${formatDataHoraBr(parseDataHora(c.dataHora))} · ${c.tipo === 'ONLINE' ? 'Online' : 'Presencial'}`,
    convenio: c.convenio,
    /** Cancelada aparece riscada e esmaecida. */
    cancelada: c.status === 'CANCELADA',
  };
}

// ---------- Filtro ----------

export type FiltroConsultas = 'todas' | 'proximas' | 'realizadas';

export const OPCOES_FILTRO: { valor: FiltroConsultas; label: string }[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'proximas', label: 'Próximas' },
  { valor: 'realizadas', label: 'Realizadas' },
];

/**
 * Consultas de cada filtro: "Próximas" são as agendadas ou confirmadas que ainda não passaram,
 * da mais perto para a mais longe; "Realizadas" e "Todas" seguem da mais recente para a mais antiga.
 */
export function consultasDoFiltro(
  consultas: Consulta[],
  filtro: FiltroConsultas,
  agora: Date,
): Consulta[] {
  if (filtro === 'proximas') {
    return ordenarConsultas(
      consultas.filter(
        (c) =>
          (c.status === 'AGENDADA' || c.status === 'CONFIRMADA') &&
          parseDataHora(c.dataHora) >= agora,
      ),
    ).reverse();
  }
  if (filtro === 'realizadas') {
    return ordenarConsultas(consultas.filter((c) => c.status === 'REALIZADA'));
  }
  return ordenarConsultas(consultas);
}

export function mensagemListaVazia(filtro: FiltroConsultas): string {
  switch (filtro) {
    case 'proximas':
      return 'Você não tem consultas marcadas.';
    case 'realizadas':
      return 'Você ainda não tem consultas realizadas.';
    default:
      return 'Você ainda não tem consultas.';
  }
}
