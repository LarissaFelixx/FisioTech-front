import type { Consulta, ConsultaCreateRequest, TipoConsulta } from '../../types/consulta';
import type { Paciente } from '../../types/paciente';
import { paraLocalDateTime, rotuloDia } from '../../utils/date';
import { mensagemDeErro } from '../../utils/mensagensErro';
import { lerValor } from '../../utils/moeda';
import { dataBr, hora, obrigatorio, valorEmReais, type Schema } from '../../utils/validation';

/** Regras de `features/consultas` (lista, formulário e detalhe) do Angular, como funções puras. */

// ---------- Lista ----------

export type Filtro = 'todas' | 'agendadas' | 'canceladas' | 'remarcadas';

export const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'agendadas', label: 'Agendadas' },
  { valor: 'canceladas', label: 'Canceladas' },
  { valor: 'remarcadas', label: 'Remarcadas' },
];

export function filtrarConsultas(consultas: Consulta[], filtro: Filtro): Consulta[] {
  switch (filtro) {
    case 'agendadas':
      return consultas.filter((c) => c.status === 'AGENDADA' || c.status === 'CONFIRMADA');
    case 'canceladas':
      return consultas.filter((c) => c.status === 'CANCELADA');
    case 'remarcadas':
      return consultas.filter((c) => c.foiRemarcada);
    default:
      return consultas;
  }
}

export interface GrupoConsultas {
  data: string;
  label: string;
  consultas: Consulta[];
}

/** Agrupa por dia: dias mais recentes primeiro; dentro do dia, em ordem de horário. */
export function agruparPorDia(consultas: Consulta[]): GrupoConsultas[] {
  const porData = new Map<string, Consulta[]>();
  for (const c of consultas) {
    const chave = c.dataHora.slice(0, 10);
    porData.set(chave, [...(porData.get(chave) ?? []), c]);
  }
  return Array.from(porData.entries())
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([data, doDia]) => ({
      data,
      label: rotuloDia(data),
      consultas: [...doDia].sort((a, b) => a.dataHora.localeCompare(b.dataHora)),
    }));
}

export function tipoLabel(tipo: TipoConsulta): string {
  return tipo === 'ONLINE' ? 'Online' : 'Presencial';
}

// ---------- Nova consulta ----------

/** Busca de paciente no formulário: só pelo nome, como no Angular. */
export function filtrarPorNome(pacientes: Paciente[], termo: string): Paciente[] {
  const t = termo.trim().toLowerCase();
  return t ? pacientes.filter((p) => p.nome.toLowerCase().includes(t)) : pacientes;
}

export const TIPO_OPCOES = [
  { valor: 'PRESENCIAL', label: 'Presencial' },
  { valor: 'ONLINE', label: 'Online' },
];

export type ConsultaCampos = 'data' | 'hora' | 'tipo' | 'convenio' | 'valor';
export type ConsultaFormValues = Record<ConsultaCampos, string>;

export const CONSULTA_VAZIA: ConsultaFormValues = {
  data: '',
  hora: '',
  tipo: 'PRESENCIAL',
  convenio: '',
  valor: '',
};

/** Data e hora obrigatórias (o `datetime-local` do Angular virou dois campos com máscara). */
export const schemaConsulta: Partial<Schema<ConsultaCampos>> = {
  data: [obrigatorio, dataBr],
  hora: [obrigatorio, hora],
  valor: [valorEmReais],
};

export function montarConsulta(pacienteId: number, v: ConsultaFormValues): ConsultaCreateRequest {
  const dataHora = paraLocalDateTime(v.data, v.hora);
  if (!dataHora) {
    throw new Error('Data e hora inválidas.');
  }
  return {
    pacienteId,
    dataHora,
    tipo: v.tipo as TipoConsulta,
    convenio: v.convenio.trim() || null,
    valor: lerValor(v.valor),
  };
}

export function mensagemErroCriarConsulta(error: unknown): string {
  return mensagemDeErro(error, {}, 'Não foi possível criar a consulta.');
}

export function mensagemErroCadastroRapido(error: unknown): string {
  return mensagemDeErro(
    error,
    { 409: 'Já existe um paciente cadastrado com este email.' },
    'Não foi possível cadastrar. Tente novamente.',
  );
}

// ---------- Detalhe (prontuário) ----------

export function mensagemErroExcluirConsulta(error: unknown): string {
  return mensagemDeErro(error, {}, 'Não foi possível excluir a consulta.');
}

export interface SecaoProntuario {
  titulo: string;
  linhas: { rotulo: string; valor: string }[];
}

const simNao = (v: boolean) => (v ? 'Sim' : 'Não');

/**
 * Seções do prontuário com o que foi registrado no registro clínico. Cada seção aparece se
 * tiver ao menos um dado. (O Angular escondia a seção inteira em alguns casos, como quando só o
 * histórico de saúde estava preenchido, e não mostrava cirurgias.)
 */
export function secoesProntuario(c: Consulta): SecaoProntuario[] {
  const q = c.quadroClinico;
  const h = c.habitosVida;
  const e = c.exameFisico;
  const d = c.diagnostico;

  const secoes: SecaoProntuario[] = [
    {
      titulo: 'Quadro Clínico',
      linhas: [
        q.queixaPrincipal ? { rotulo: 'Queixa principal', valor: q.queixaPrincipal } : null,
        q.historiaDoencaAtual
          ? { rotulo: 'História da doença atual', valor: q.historiaDoencaAtual }
          : null,
        q.historicoSaude ? { rotulo: 'Histórico de saúde', valor: q.historicoSaude } : null,
        q.cirurgias ? { rotulo: 'Cirurgias', valor: q.cirurgiasDescricao || 'Sim' } : null,
        q.lesoesAnteriores
          ? { rotulo: 'Lesões anteriores', valor: q.lesoesAnterioresDescricao || 'Sim' }
          : null,
        q.medicamentos ? { rotulo: 'Medicamentos', valor: q.medicamentos } : null,
      ].filter((l) => l !== null),
    },
    {
      titulo: 'Hábitos de Vida',
      linhas: [
        h.atividadeFisica ? { rotulo: 'Atividade física', valor: h.atividadeFisica } : null,
        h.rotinaTrabalho ? { rotulo: 'Rotina de trabalho', valor: h.rotinaTrabalho } : null,
        h.tabagismo != null ? { rotulo: 'Tabagismo', valor: simNao(h.tabagismo) } : null,
        h.consumoAlcool != null
          ? { rotulo: 'Consumo de álcool', valor: simNao(h.consumoAlcool) }
          : null,
      ].filter((l) => l !== null),
    },
    {
      titulo: 'Exame Físico',
      linhas: [
        e.postura ? { rotulo: 'Postura', valor: e.postura } : null,
        e.amplitudeMovimento
          ? { rotulo: 'Amplitude do movimento', valor: e.amplitudeMovimento }
          : null,
        e.palpacao ? { rotulo: 'Palpação', valor: e.palpacao } : null,
        e.forcaMuscular ? { rotulo: 'Força muscular', valor: e.forcaMuscular } : null,
      ].filter((l) => l !== null),
    },
    {
      titulo: 'Diagnóstico',
      linhas: [
        d.planoTratamento ? { rotulo: 'Plano de tratamento', valor: d.planoTratamento } : null,
        d.objetivosTratamento
          ? { rotulo: 'Objetivos do tratamento', valor: d.objetivosTratamento }
          : null,
      ].filter((l) => l !== null),
    },
  ];
  return secoes.filter((s) => s.linhas.length > 0);
}

/** Nota de 1 a 5 em estrelas: 4 → "★★★★☆". */
export function estrelas(nota: number): string {
  const n = Math.max(0, Math.min(5, Math.round(nota)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}
