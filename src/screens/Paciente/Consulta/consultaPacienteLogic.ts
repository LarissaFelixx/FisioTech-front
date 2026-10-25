import type { Consulta } from '../../../types/consulta';
import type { SlotDisponibilidade } from '../../../types/consultaBooking';
import { formatDataBr, formatHora, parseDataHora } from '../../../utils/date';
import { mensagemDeErro } from '../../../utils/mensagensErro';

/**
 * Regras do detalhe da consulta do paciente (#41; origem: `features/paciente/
 * paciente-consulta-detail` do Angular), como funções puras.
 */

// ---------- Dados da consulta ----------

/** Só consultas agendadas ou confirmadas podem ser remarcadas ou canceladas (400 no backend). */
export function podeAlterar(c: Consulta): boolean {
  return c.status === 'AGENDADA' || c.status === 'CONFIRMADA';
}

/** Linha de dados do Figma: data, hora, modalidade e convênio. */
export function metaConsulta(c: Consulta) {
  const quando = parseDataHora(c.dataHora);
  return {
    data: formatDataBr(quando),
    hora: formatHora(quando),
    modalidade: c.tipo === 'ONLINE' ? 'Online' : 'Presencial',
    convenio: c.convenio,
  };
}

export interface SecaoClinica {
  titulo: string;
  linhas: { rotulo: string; valor: string }[];
}

/**
 * Seções que o paciente vê, como no Angular: Quadro Clínico (queixa, história, medicamentos),
 * Exame Físico e Diagnóstico. Cada seção só aparece se tiver algum dado.
 */
export function secoesClinicas(c: Consulta): SecaoClinica[] {
  const linha = (rotulo: string, valor: string | null) => (valor ? { rotulo, valor } : null);
  const secoes = [
    {
      titulo: 'Quadro Clínico',
      linhas: [
        linha('Queixa principal', c.quadroClinico.queixaPrincipal),
        linha('História da doença atual', c.quadroClinico.historiaDoencaAtual),
        linha('Medicamentos', c.quadroClinico.medicamentos),
      ],
    },
    {
      titulo: 'Exame Físico',
      linhas: [
        linha('Postura', c.exameFisico.postura),
        linha('Amplitude do movimento', c.exameFisico.amplitudeMovimento),
        linha('Palpação', c.exameFisico.palpacao),
        linha('Força muscular', c.exameFisico.forcaMuscular),
      ],
    },
    {
      titulo: 'Diagnóstico',
      linhas: [
        linha('Plano de tratamento', c.diagnostico.planoTratamento),
        linha('Objetivos do tratamento', c.diagnostico.objetivosTratamento),
      ],
    },
  ];
  return secoes
    .map((s) => ({ ...s, linhas: s.linhas.filter((l) => l !== null) }))
    .filter((s) => s.linhas.length > 0);
}

// ---------- Remarcar ----------

const DIAS_CURTOS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
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

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** `Date` → `AAAA-MM-DD` em hora local (formato do `?data=` da disponibilidade). */
export function dataIso(d: Date): string {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

export interface DiaOpcao {
  iso: string;
  semana: string;
  dia: string;
}

/** Faixa de dias para remarcar (como a de "Marcar consulta" do Figma), a partir de hoje. */
export function proximosDias(hoje: Date, quantidade = 14): DiaOpcao[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    return { iso: dataIso(d), semana: DIAS_CURTOS[d.getDay()], dia: doisDigitos(d.getDate()) };
  });
}

/** `"08:30:00"` → `"08:30"`. */
export const horaCurta = (horario: string) => horario.slice(0, 5);

/** Horário já passado hoje não pode ser escolhido (a grade do backend é fixa, de 08:00 às 17:30). */
export function slotEscolhivel(slot: SlotDisponibilidade, dia: string, agora: Date): boolean {
  if (!slot.disponivel) {
    return false;
  }
  return parseDataHora(`${dia}T${slot.horario}`) > agora;
}

/** LocalDateTime enviado em `PUT /me/consultas/{id}/remarcar`. */
export function novaDataHora(dia: string, horario: string): string {
  return `${dia}T${horaCurta(horario)}:00`;
}

/** "Confirmar 22 ago, 09:00" (botão do Figma). */
export function rotuloConfirmar(dia: string, horario: string): string {
  const d = parseDataHora(dia);
  return `Confirmar ${doisDigitos(d.getDate())} ${MESES_CURTOS[d.getMonth()]}, ${horaCurta(horario)}`;
}

// ---------- Mensagens ----------

export const MENSAGEM_ERRO_CARREGAR = 'Não foi possível carregar a consulta.';

export function mensagemErroCancelar(error: unknown): string {
  return mensagemDeErro(error, {}, 'Não foi possível cancelar a consulta.');
}

export function mensagemErroRemarcar(error: unknown): string {
  return mensagemDeErro(
    error,
    { 409: 'Este horário não está mais disponível. Escolha outro.' },
    'Não foi possível remarcar a consulta.',
  );
}
