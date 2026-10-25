import type {
  Consulta,
  ConsultaUpdateRequest,
  Diagnostico,
  ExameFisico,
  HabitosVida,
  QuadroClinico,
} from '../../types/consulta';
import { mensagemDeErro } from '../../utils/mensagensErro';

/** Regras de `features/consultas/consulta-wizard` do Angular, como funções puras. */

// ---------- Etapas ----------

export type Etapa = 'quadro-clinico' | 'habitos-vida' | 'exame-fisico' | 'diagnostico' | 'sucesso';

export const ETAPAS: Etapa[] = [
  'quadro-clinico',
  'habitos-vida',
  'exame-fisico',
  'diagnostico',
  'sucesso',
];

/** Etapas com formulário (a de sucesso não conta no "Passo N de 4"). */
export const TOTAL_ETAPAS = 4;

export const TITULOS: Record<Etapa, string> = {
  'quadro-clinico': 'Quadro Clínico',
  'habitos-vida': 'Hábitos de Vida',
  'exame-fisico': 'Exame Físico',
  diagnostico: 'Diagnóstico',
  sucesso: 'Consulta realizada com sucesso!',
};

/** Posição da etapa, de 1 a 4 (`stepNumber()` no Angular). */
export function numeroDaEtapa(etapa: Etapa): number {
  return ETAPAS.indexOf(etapa) + 1;
}

export function proximaEtapa(etapa: Etapa): Etapa {
  return ETAPAS[Math.min(ETAPAS.indexOf(etapa) + 1, ETAPAS.length - 1)];
}

/** Etapa anterior, ou `null` na primeira. */
export function etapaAnterior(etapa: Etapa): Etapa | null {
  const i = ETAPAS.indexOf(etapa);
  return i > 0 ? ETAPAS[i - 1] : null;
}

/** Só dá para voltar a uma etapa anterior (`irParaEtapa`); nunca pular para a frente. */
export function podeIrPara(atual: Etapa, destino: Etapa): boolean {
  return ETAPAS.indexOf(destino) < ETAPAS.indexOf(atual);
}

const algumPreenchido = (bloco: object) => Object.values(bloco).some((v) => v !== null);

/**
 * Onde reabrir o registro (`calcularEtapaParaRetomar`). Cada etapa só é enviada ao backend quando
 * o profissional avança a partir dela, e com os campos em branco como "" (não `null`). Então um
 * campo diferente de `null` prova que a etapa já foi salva, e a retomada abre na primeira etapa
 * que ainda não tem esse sinal.
 */
export function etapaParaRetomar(c: Consulta): Etapa {
  if (c.status === 'REALIZADA') {
    return 'sucesso';
  }
  if (algumPreenchido(c.exameFisico)) {
    return 'diagnostico';
  }
  if (algumPreenchido(c.habitosVida)) {
    return 'exame-fisico';
  }
  if (algumPreenchido(c.quadroClinico)) {
    return 'habitos-vida';
  }
  return 'quadro-clinico';
}

// ---------- Histórico de saúde ----------

export const OPCOES_HISTORICO = ['Hipertensão', 'Diabetes', 'Asma'];

/** Máximo do backend para `historicoSaude` (`@Size(max = 255)`). */
export const MAX_HISTORICO = 255;

/** Máximo do backend para os demais campos de texto (`@Size(max = 2000)`). */
export const MAX_TEXTO = 2000;

export interface HistoricoForm {
  /** Chips fixos marcados, na ordem em que foram marcados. */
  opcoes: string[];
  outrasAtivo: boolean;
  outras: string;
}

const termos = (texto: string | null) =>
  (texto ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

/**
 * Separa o texto salvo em chips fixos e "Outras". O Angular reabria com "Outras" desmarcado e o
 * campo vazio, escondendo o que tinha sido digitado; aqui "Outras" volta marcado e preenchido.
 */
export function lerHistorico(texto: string | null): HistoricoForm {
  const todos = termos(texto);
  const opcoes = todos.filter((t) => OPCOES_HISTORICO.includes(t));
  const outras = todos.filter((t) => !OPCOES_HISTORICO.includes(t)).join(', ');
  return { opcoes, outrasAtivo: outras !== '', outras };
}

export function alternarOpcao(h: HistoricoForm, opcao: string): HistoricoForm {
  const opcoes = h.opcoes.includes(opcao)
    ? h.opcoes.filter((o) => o !== opcao)
    : [...h.opcoes, opcao];
  return { ...h, opcoes };
}

/**
 * Texto enviado ao backend: chips marcados e, se "Outras" estiver marcado, o texto livre, tudo
 * separado por ", ". Desmarcar "Outras" tira o texto livre do que é salvo (no Angular ele
 * continuava sendo enviado, escondido).
 */
export function serializarHistorico(h: HistoricoForm): string {
  const outras = h.outrasAtivo ? h.outras.trim() : '';
  return [...h.opcoes, ...(outras ? [outras] : [])].join(', ');
}

/** Quanto sobra para "Outras" dentro do limite de 255 do backend. */
export function limiteOutras(h: HistoricoForm): number {
  const fixos = h.opcoes.join(', ');
  return Math.max(0, MAX_HISTORICO - (fixos ? fixos.length + 2 : 0));
}

// ---------- Formulários ----------

type SemNulos<T> = { [K in keyof T]: NonNullable<T[K]> };

export type QuadroForm = Omit<SemNulos<QuadroClinico>, 'historicoSaude'> & {
  historico: HistoricoForm;
};
export type HabitosForm = SemNulos<HabitosVida>;
export type ExameForm = SemNulos<ExameFisico>;
export type DiagnosticoForm = SemNulos<Diagnostico>;

export interface WizardForms {
  quadro: QuadroForm;
  habitos: HabitosForm;
  exame: ExameForm;
  diagnostico: DiagnosticoForm;
}

/** Preenche os formulários com o que já foi salvo (`preencherFormularios`). */
export function formsDaConsulta(c: Consulta): WizardForms {
  const q = c.quadroClinico;
  const h = c.habitosVida;
  const e = c.exameFisico;
  const d = c.diagnostico;
  return {
    quadro: {
      queixaPrincipal: q.queixaPrincipal ?? '',
      historiaDoencaAtual: q.historiaDoencaAtual ?? '',
      historico: lerHistorico(q.historicoSaude),
      cirurgias: q.cirurgias ?? false,
      cirurgiasDescricao: q.cirurgiasDescricao ?? '',
      lesoesAnteriores: q.lesoesAnteriores ?? false,
      lesoesAnterioresDescricao: q.lesoesAnterioresDescricao ?? '',
      medicamentos: q.medicamentos ?? '',
    },
    habitos: {
      atividadeFisica: h.atividadeFisica ?? '',
      rotinaTrabalho: h.rotinaTrabalho ?? '',
      tabagismo: h.tabagismo ?? false,
      consumoAlcool: h.consumoAlcool ?? false,
    },
    exame: {
      postura: e.postura ?? '',
      amplitudeMovimento: e.amplitudeMovimento ?? '',
      palpacao: e.palpacao ?? '',
      forcaMuscular: e.forcaMuscular ?? '',
    },
    diagnostico: {
      planoTratamento: d.planoTratamento ?? '',
      objetivosTratamento: d.objetivosTratamento ?? '',
    },
  };
}

export function quadroParaApi(q: QuadroForm): QuadroClinico {
  const { historico, ...campos } = q;
  return { ...campos, historicoSaude: serializarHistorico(historico) };
}

/**
 * Corpo do `PUT /consultas/{id}` ao avançar (`proximo()`): os dados-base da consulta como vieram
 * do backend e só o bloco da etapa atual. Os blocos omitidos são mantidos pelo backend. Na etapa
 * de diagnóstico, a consulta passa a `REALIZADA`.
 */
export function montarAtualizacao(
  c: Consulta,
  etapa: Etapa,
  forms: WizardForms,
): ConsultaUpdateRequest {
  const base: ConsultaUpdateRequest = {
    dataHora: c.dataHora,
    tipo: c.tipo,
    status: c.status,
    convenio: c.convenio,
    valor: c.valor,
  };
  switch (etapa) {
    case 'quadro-clinico':
      return { ...base, quadroClinico: quadroParaApi(forms.quadro) };
    case 'habitos-vida':
      return { ...base, habitosVida: forms.habitos };
    case 'exame-fisico':
      return { ...base, exameFisico: forms.exame };
    case 'diagnostico':
      return { ...base, status: 'REALIZADA', diagnostico: forms.diagnostico };
    default:
      throw new Error('A etapa de sucesso não tem o que salvar.');
  }
}

export const MENSAGEM_ERRO_CARREGAR = 'Não foi possível carregar a consulta.';
export const MENSAGEM_ERRO_SALVAR = 'Não foi possível salvar. Tente novamente.';

/** Sem conexão tem mensagem própria, como nas outras telas; o resto usa a do Angular. */
export function mensagemErroSalvar(error: unknown): string {
  return mensagemDeErro(error, {}, MENSAGEM_ERRO_SALVAR);
}
