import type { Consulta } from '../../../types/consulta';
import type { MinhaConversaItem } from '../../../types/mensagem';
import { formatHora, parseDataHora } from '../../../utils/date';

/**
 * Regras da Home do paciente (#38; origem: `features/paciente/paciente-home` do Angular), como
 * funções puras.
 */

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

const emAberto = (c: Consulta) => c.status === 'AGENDADA' || c.status === 'CONFIRMADA';

/**
 * A consulta em aberto (agendada ou confirmada) mais próxima que ainda não passou. O Angular
 * pegava a mais antiga em aberto, mesmo que já tivesse passado; aqui ela some do destaque.
 */
export function proximaConsulta(consultas: Consulta[], agora: Date): Consulta | null {
  const futuras = consultas.filter((c) => emAberto(c) && parseDataHora(c.dataHora) >= agora);
  futuras.sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  return futuras[0] ?? null;
}

const plural = (n: number, palavra: string) => `${n} ${palavra}${n === 1 ? '' : 's'}`;

/** "4 consultas · 1 agendada" (agendadas = agendadas + confirmadas, como no Angular). */
export function resumoConsultas(consultas: Consulta[]): string {
  return `${plural(consultas.length, 'consulta')} · ${plural(consultas.filter(emAberto).length, 'agendada')}`;
}

/** Destaque do Figma: "22" grande, "ago · 09:00" ao lado e "Ana Souza · Presencial" embaixo. */
export function destaqueConsulta(c: Consulta) {
  const quando = parseDataHora(c.dataHora);
  return {
    dia: String(quando.getDate()).padStart(2, '0'),
    mesHora: `${MESES_CURTOS[quando.getMonth()]} · ${formatHora(quando)}`,
    detalhe: `${c.profissionalNome} · ${c.tipo === 'ONLINE' ? 'Online' : 'Presencial'}`,
  };
}

/** Ponto laranja em "Mensagens": alguma conversa terminou com mensagem do profissional. */
export function temMensagemNova(conversas: MinhaConversaItem[]): boolean {
  return conversas.some((c) => c.ultimoAutor === 'PROFISSIONAL');
}
