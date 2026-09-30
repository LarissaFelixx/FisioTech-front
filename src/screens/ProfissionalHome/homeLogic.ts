import type { Consulta } from '../../types/consulta';
import { formatDiaMesCurto, mesmoDia, parseDataHora } from '../../utils/date';

/** Regras de `features/home/home.ts` do Angular, como funções puras e testáveis. */

const horario = (c: Consulta) => parseDataHora(c.dataHora).getTime();
const porHorario = (a: Consulta, b: Consulta) => horario(a) - horario(b);

/** Primeira consulta AGENDADA ou CONFIRMADA a partir de agora. */
export function proximaConsulta(consultas: Consulta[], agora: Date): Consulta | null {
  const proximas = consultas
    .filter(
      (c) =>
        (c.status === 'AGENDADA' || c.status === 'CONFIRMADA') && horario(c) >= agora.getTime(),
    )
    .sort(porHorario);
  return proximas[0] ?? null;
}

/** Consultas de hoje que não foram canceladas, em ordem de horário ("sessões hoje"). */
export function consultasHoje(consultas: Consulta[], agora: Date): Consulta[] {
  return consultas
    .filter((c) => mesmoDia(parseDataHora(c.dataHora), agora) && c.status !== 'CANCELADA')
    .sort(porHorario);
}

/** Agenda de hoje sem a consulta que já aparece no destaque. */
export function agendaHoje(consultas: Consulta[], agora: Date): Consulta[] {
  const proxima = proximaConsulta(consultas, agora);
  return consultasHoje(consultas, agora).filter((c) => c.id !== proxima?.id);
}

export function tipoLabel(consulta: Consulta): string {
  return consulta.tipo === 'ONLINE' ? 'Online' : 'Presencial';
}

/** "Online · Unimed" ou "Presencial · Particular". */
export function subtitulo(consulta: Consulta): string {
  return `${tipoLabel(consulta)} · ${consulta.convenio ?? 'Particular'}`;
}

/** Badge do destaque: "agora", "em 25 min", "em 2h 5min", "em 3h", ou "05 de set." se não for hoje. */
export function countdown(consulta: Consulta, agora: Date): string {
  const data = parseDataHora(consulta.dataHora);
  if (!mesmoDia(data, agora)) {
    return formatDiaMesCurto(data);
  }
  const diffMin = Math.round((data.getTime() - agora.getTime()) / 60000);
  if (diffMin <= 0) {
    return 'agora';
  }
  if (diffMin < 60) {
    return `em ${diffMin} min`;
  }
  const horas = Math.floor(diffMin / 60);
  const minutos = diffMin % 60;
  return minutos > 0 ? `em ${horas}h ${minutos}min` : `em ${horas}h`;
}
