// Evolução clínica registrada pelo profissional (`EvolucaoRequest` do backend Fisio-Teach).

export interface EvolucaoCreateRequest {
  /** Consulta em que a evolução foi registrada. */
  consultaId: number | null;
  observacoes: string;
  procedimentos: string | null;
  respostaPaciente: string | null;
  conduta: string | null;
  visivelPaciente: boolean;
}
