// Prontuário do paciente, campo a campo com os DTOs do backend Fisio-Teach. As respostas
// (`EvolucaoResponse` e `PlanoResponse`) são as mesmas em `/prontuario/**`, do profissional, e em
// `/me/prontuario/**`, do paciente (que só recebe o que foi marcado como visível).

export type StatusPlano = 'ATIVO' | 'SUBSTITUIDO' | 'ENCERRADO';

export interface PlanoTerapeutico {
  id: number;
  pacienteId: number;
  profissionalId: number;
  profissionalNome: string;
  revisao: number;
  objetivos: string;
  condutas: string;
  /** LocalDate (`AAAA-MM-DD`). */
  dataInicio: string;
  dataFimPrevista: string | null;
  status: StatusPlano;
  visivelPaciente: boolean;
  dataCriacao: string;
}

export interface EvolucaoClinica {
  id: number;
  pacienteId: number;
  profissionalId: number;
  profissionalNome: string;
  consultaId: number | null;
  observacoes: string;
  procedimentos: string | null;
  respostaPaciente: string | null;
  conduta: string | null;
  visivelPaciente: boolean;
  /** LocalDateTime sem fuso. */
  dataRegistro: string;
}

/** `PlanoRequest`: cada revisão salva substitui a ativa anterior (que vira `SUBSTITUIDO`). */
export interface PlanoCreateRequest {
  objetivos: string;
  condutas: string;
  /** LocalDate (`AAAA-MM-DD`). */
  dataInicio: string;
  dataFimPrevista: string | null;
  visivelPaciente: boolean;
}

/** `EvolucaoRequest`: evolução clínica registrada pelo profissional. */
export interface EvolucaoCreateRequest {
  /** Consulta em que a evolução foi registrada. */
  consultaId: number | null;
  observacoes: string;
  procedimentos: string | null;
  respostaPaciente: string | null;
  conduta: string | null;
  visivelPaciente: boolean;
}
