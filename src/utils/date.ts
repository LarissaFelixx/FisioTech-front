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

const pad = (n: number) => String(n).padStart(2, '0');

/** Formato `dd/MM/yyyy` (DatePipe do Angular). */
export function formatDataBr(data: Date): string {
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()}`;
}

/** Formato `dd/MM/yyyy HH:mm` (DatePipe do Angular). */
export function formatDataHoraBr(data: Date): string {
  return `${formatDataBr(data)} ${formatHora(data)}`;
}

/** Aplica a máscara DD/MM/AAAA enquanto o usuário digita (só dígitos, até 8). */
export function mascararData(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) {
    return digitos;
  }
  if (digitos.length <= 4) {
    return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  }
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/** `31/01/1990` → `1990-01-31` (LocalDate do backend); `null` se incompleta ou inexistente. */
export function dataBrParaIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) {
    return null;
  }
  const [, dia, mes, ano] = m.map(Number);
  const data = new Date(ano, mes - 1, dia);
  const valida =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return valida ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** `1990-01-31` → `31/01/1990`; vazio para `null`. */
export function isoParaDataBr(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}
