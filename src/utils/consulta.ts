import type { StatusConsulta } from '../types/consulta';

/** Rótulo legível do status (o Angular exibia o enum cru, ex.: "AGENDADA"). */
export const STATUS_LABEL: Record<StatusConsulta, string> = {
  AGENDADA: 'Agendada',
  CONFIRMADA: 'Confirmada',
  REALIZADA: 'Realizada',
  CANCELADA: 'Cancelada',
};
