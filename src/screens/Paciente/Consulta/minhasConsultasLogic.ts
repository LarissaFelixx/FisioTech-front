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
