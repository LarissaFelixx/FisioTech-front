// Origem: core/consultas/consulta.model.ts (Angular), copiado campo a campo.

export type TipoConsulta = 'PRESENCIAL' | 'ONLINE';
export type StatusConsulta = 'AGENDADA' | 'CONFIRMADA' | 'REALIZADA' | 'CANCELADA';

export interface QuadroClinico {
  queixaPrincipal: string | null;
  historiaDoencaAtual: string | null;
  historicoSaude: string | null;
  cirurgias: boolean | null;
  cirurgiasDescricao: string | null;
  lesoesAnteriores: boolean | null;
  lesoesAnterioresDescricao: string | null;
  medicamentos: string | null;
}

export interface HabitosVida {
  atividadeFisica: string | null;
  rotinaTrabalho: string | null;
  tabagismo: boolean | null;
  consumoAlcool: boolean | null;
}

export interface ExameFisico {
  postura: string | null;
  amplitudeMovimento: string | null;
  palpacao: string | null;
  forcaMuscular: string | null;
}

export interface Diagnostico {
  planoTratamento: string | null;
  objetivosTratamento: string | null;
}

export interface Consulta {
  id: number;
  pacienteId: number;
  pacienteNome: string;
  profissionalId: number;
  profissionalNome: string;
  dataHora: string;
  tipo: TipoConsulta;
  status: StatusConsulta;
  foiRemarcada: boolean;
  convenio: string | null;
  valor: number | null;
  quadroClinico: QuadroClinico;
  habitosVida: HabitosVida;
  exameFisico: ExameFisico;
  diagnostico: Diagnostico;
  dataCriacao: string;
}

export interface ConsultaCreateRequest {
  pacienteId: number;
  dataHora: string;
  tipo: TipoConsulta;
  convenio: string | null;
  valor: number | null;
}

export interface ConsultaUpdateRequest {
  dataHora: string;
  tipo: TipoConsulta;
  status: StatusConsulta;
  convenio: string | null;
  valor: number | null;
  quadroClinico?: QuadroClinico | null;
  habitosVida?: HabitosVida | null;
  exameFisico?: ExameFisico | null;
  diagnostico?: Diagnostico | null;
}
