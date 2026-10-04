// Origem: core/profissionais/profissional.model.ts (Angular), copiado campo a campo; conferido com os DTOs do backend.

export interface Profissional {
  id: number;
  nome: string;
  email: string;
  registroProfissional: string;
  especialidade: string;
  valorConsultaParticular: number | null;
  conveniosAceitos: string[];
  foto: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  telefone: string | null;
  dataCriacao: string;
}

export interface ProfissionalCreateRequest {
  nome: string;
  email: string;
  senha: string;
  registroProfissional: string;
  especialidade: string;
  valorConsultaParticular: number | null;
  conveniosAceitos: string[];
  foto: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  telefone: string | null;
}

export interface ProfissionalUpdateRequest {
  nome: string;
  email: string;
  senha: string | null;
  registroProfissional: string;
  especialidade: string;
  valorConsultaParticular: number | null;
  conveniosAceitos: string[];
  foto: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  telefone: string | null;
}
