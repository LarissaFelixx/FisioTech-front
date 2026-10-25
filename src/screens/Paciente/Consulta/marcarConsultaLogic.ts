import type { DiaSeletor, HorarioSeletor } from '../../../components/SeletorHorario/SeletorHorario';
import type { TipoConsulta } from '../../../types/consulta';
import type {
  ConsultaBookingRequest,
  DisponibilidadeResponse,
  ProfissionalBusca,
} from '../../../types/consultaBooking';
import { parseDataHora } from '../../../utils/date';
import { mensagemDeErro } from '../../../utils/mensagensErro';

/**
 * Regras de "Marcar consulta" (#40; origem: `features/paciente/consulta-booking` do Angular),
 * como funções puras.
 */

export type FormaPagamento = 'particular' | 'convenio';

// ---------- Profissional ----------

function normalizar(texto: string): string {
  return texto.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Busca local por nome ou especialidade, sem acento nem caixa (não pede ao backend a cada tecla). */
export function filtrarProfissionais(
  profissionais: ProfissionalBusca[],
  busca: string,
): ProfissionalBusca[] {
  const termo = normalizar(busca);
  if (!termo) {
    return profissionais;
  }
  return profissionais.filter(
    (p) => normalizar(p.nome).includes(termo) || normalizar(p.especialidade).includes(termo),
  );
}

// ---------- Dia e horário ----------

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

/** Faixa de dias do Figma ("SÁB 22"), a partir de hoje. */
export function proximosDias(hoje: Date, quantidade = 14): DiaSeletor[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    return { iso: dataIso(d), semana: DIAS_CURTOS[d.getDay()], dia: doisDigitos(d.getDate()) };
  });
}

/** `"08:30:00"` → `"08:30"`. */
export const horaCurta = (horario: string) => horario.slice(0, 5);

/**
 * Grade do dia: horário ocupado ou que já passou (a grade do backend é fixa, das 08:00 às 17:30,
 * e o backend não recusa horário passado) aparece desabilitado.
 */
export function horariosDoDia(
  disponibilidade: DisponibilidadeResponse,
  dia: string,
  agora: Date,
): HorarioSeletor[] {
  return disponibilidade.horarios.map((slot) => ({
    valor: slot.horario,
    label: horaCurta(slot.horario),
    habilitado: slot.disponivel && parseDataHora(`${dia}T${slot.horario}`) > agora,
  }));
}

/** "22 ago, 09:00", usado no botão ("Confirmar 22 ago, 09:00") e na confirmação. */
export function quandoCurto(dia: string, horario: string): string {
  const d = parseDataHora(dia);
  return `${doisDigitos(d.getDate())} ${MESES_CURTOS[d.getMonth()]}, ${horaCurta(horario)}`;
}

// ---------- Pagamento e pedido ----------

export interface EscolhaConsulta {
  dia: string;
  horario: string | null;
  tipo: TipoConsulta;
  forma: FormaPagamento;
  convenio: string | null;
}

/** Precisa de um horário e, no convênio, de um convênio escolhido. */
export function podeConfirmar(e: EscolhaConsulta): boolean {
  return e.horario !== null && (e.forma === 'particular' || !!e.convenio);
}

/** Corpo do `POST /me/consultas`; particular vai sem convênio (o backend cobra o valor dele). */
export function pedidoConsulta(
  profissionalId: number,
  e: EscolhaConsulta & { horario: string },
): ConsultaBookingRequest {
  return {
    profissionalId,
    dataHora: `${e.dia}T${horaCurta(e.horario)}:00`,
    tipo: e.tipo,
    convenio: e.forma === 'convenio' ? e.convenio : null,
  };
}

// ---------- Mensagens ----------

export const MENSAGEM_HORARIO_OCUPADO = 'Este horário não está mais disponível. Escolha outro.';

export function mensagemErroMarcar(error: unknown): string {
  return mensagemDeErro(
    error,
    { 409: MENSAGEM_HORARIO_OCUPADO },
    'Não foi possível marcar a consulta. Tente novamente.',
  );
}
