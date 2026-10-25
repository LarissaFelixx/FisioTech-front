/**
 * O backend serializa `LocalDateTime` sem fuso (ex.: `2026-09-29T14:30:00`), que representa o
 * horário local da clínica. Aqui o valor é lido campo a campo em hora local, sem depender de como
 * cada engine JS interpreta strings ISO sem fuso.
 */
const REGEX_DATA_HORA_LOCAL =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?/;

const REGEX_DATA_BR = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const REGEX_DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})/;

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

/** Completa com zero à esquerda até 2 dígitos (ex.: 5 → "05"). */
const zeroEsquerda = (numero: number): string => String(numero).padStart(2, '0');

export function parseDataHora(valor: string): Date {
  const partes = REGEX_DATA_HORA_LOCAL.exec(valor);
  if (!partes) {
    return new Date(valor);
  }
  const [, ano, mes, dia, hora = '0', minuto = '0', segundo = '0'] = partes;
  return new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(minuto),
    Number(segundo),
  );
}

export function mesmoDia(dataA: Date, dataB: Date): boolean {
  return (
    dataA.getFullYear() === dataB.getFullYear() &&
    dataA.getMonth() === dataB.getMonth() &&
    dataA.getDate() === dataB.getDate()
  );
}

/** Equivalente a `date: 'HH:mm'` do Angular. */
export function formatHora(data: Date): string {
  return `${zeroEsquerda(data.getHours())}:${zeroEsquerda(data.getMinutes())}`;
}

/** Equivalente a `toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })`: "05 de set.". */
export function formatDiaMesCurto(data: Date): string {
  return `${zeroEsquerda(data.getDate())} de ${MESES_CURTOS[data.getMonth()]}.`;
}

/** Formato `dd/MM/yyyy` (DatePipe do Angular). */
export function formatDataBr(data: Date): string {
  const dia = zeroEsquerda(data.getDate());
  const mes = zeroEsquerda(data.getMonth() + 1);
  return `${dia}/${mes}/${data.getFullYear()}`;
}

/** Formato `dd/MM/yyyy HH:mm` (DatePipe do Angular). */
export function formatDataHoraBr(data: Date): string {
  return `${formatDataBr(data)} ${formatHora(data)}`;
}

/** Aplica a máscara DD/MM/AAAA enquanto o usuário digita (só dígitos, até 8). */
export function mascararData(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  const dia = digitos.slice(0, 2);
  const mes = digitos.slice(2, 4);
  const ano = digitos.slice(4);

  if (digitos.length <= 2) {
    return dia;
  }
  if (digitos.length <= 4) {
    return `${dia}/${mes}`;
  }
  return `${dia}/${mes}/${ano}`;
}

/** `31/01/1990` → `1990-01-31` (LocalDate do backend); `null` se incompleta ou inexistente. */
export function dataBrParaIso(texto: string): string | null {
  const partes = REGEX_DATA_BR.exec(texto.trim());
  if (!partes) {
    return null;
  }
  const [, diaTexto, mesTexto, anoTexto] = partes;
  const dia = Number(diaTexto);
  const mes = Number(mesTexto);
  const ano = Number(anoTexto);

  const data = new Date(ano, mes - 1, dia);
  const dataExiste =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;

  return dataExiste ? `${anoTexto}-${mesTexto}-${diaTexto}` : null;
}

/** `1990-01-31` → `31/01/1990`; vazio para `null`. */
export function isoParaDataBr(iso: string | null | undefined): string {
  const partes = REGEX_DATA_ISO.exec(iso ?? '');
  if (!partes) {
    return '';
  }
  const [, ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

/** Formato `dd/MM · HH:mm` (cabeçalho do prontuário). */
export function formatDiaMesHora(data: Date): string {
  const dia = zeroEsquerda(data.getDate());
  const mes = zeroEsquerda(data.getMonth() + 1);
  return `${dia}/${mes} · ${formatHora(data)}`;
}

const DIAS_SEMANA = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];
const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/**
 * Rótulo dos grupos da lista de consultas, como o Angular fazia com
 * `toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()`:
 * `2026-09-29` → "TERÇA-FEIRA, 29 DE SETEMBRO".
 */
export function rotuloDia(dataIso: string): string {
  const data = parseDataHora(dataIso);
  const diaSemana = DIAS_SEMANA[data.getDay()];
  const dia = zeroEsquerda(data.getDate());
  return `${diaSemana}, ${dia} de ${MESES[data.getMonth()]}`.toUpperCase();
}

const REGEX_HORA = /^(\d{2}):(\d{2})$/;

/** Aplica a máscara HH:MM enquanto o usuário digita. */
export function mascararHora(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 4);
  const horas = digitos.slice(0, 2);
  const minutos = digitos.slice(2);
  return digitos.length <= 2 ? horas : `${horas}:${minutos}`;
}

/** `14:30` → `14:30`; `null` se não for um horário válido (00:00–23:59). */
export function horaValida(texto: string): string | null {
  const partes = REGEX_HORA.exec(texto.trim());
  if (!partes) {
    return null;
  }
  const [, horas, minutos] = partes;
  if (Number(horas) > 23 || Number(minutos) > 59) {
    return null;
  }
  return `${horas}:${minutos}`;
}

/** Junta data (DD/MM/AAAA) e hora (HH:MM) no LocalDateTime do backend (`AAAA-MM-DDTHH:MM:00`). */
export function paraLocalDateTime(dataBr: string, hora: string): string | null {
  const dataIso = dataBrParaIso(dataBr);
  const horaMinuto = horaValida(hora);
  return dataIso && horaMinuto ? `${dataIso}T${horaMinuto}:00` : null;
}
