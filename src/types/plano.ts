// Plano terapêutico mantido pelo profissional (`PlanoRequest` e `PlanoResponse` do backend
// Fisio-Teach). Cada revisão salva substitui a ativa anterior.

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

export interface PlanoCreateRequest {
  objetivos: string;
  condutas: string;
  /** LocalDate (`AAAA-MM-DD`). */
  dataInicio: string;
  dataFimPrevista: string | null;
  visivelPaciente: boolean;
}
