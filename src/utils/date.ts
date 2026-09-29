/**
 * O backend serializa `LocalDateTime` sem fuso (ex.: `2026-09-29T14:30:00`), que representa o
 * horário local da clínica. Aqui o valor é lido campo a campo em hora local, sem depender de como
 * cada engine JS interpreta strings ISO sem fuso.
 */
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?/;

export function parseDataHora(valor: string): Date {
  const m = LOCAL_DATE_TIME.exec(valor);
  if (!m) {
    return new Date(valor);
  }
  const [, ano, mes, dia, hora = '0', minuto = '0', segundo = '0'] = m;
  return new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(minuto),
    Number(segundo),
  );
}

export function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Equivalente a `date: 'HH:mm'` do Angular. */
export function formatHora(data: Date): string {
  return `${pad2(data.getHours())}:${pad2(data.getMinutes())}`;
}

const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

/** Equivalente a `toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })`: "05 de set.". */
export function formatDiaMesCurto(data: Date): string {
  return `${pad2(data.getDate())} de ${MESES_CURTOS[data.getMonth()]}.`;
}
