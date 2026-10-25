// Prontuário compartilhado com o paciente (`/me/prontuario/**`), campo a campo com os DTOs do
// backend Fisio-Teach (`EvolucaoResponse` e `PlanoResponse`).

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
