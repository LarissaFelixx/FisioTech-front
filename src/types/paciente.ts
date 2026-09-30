// Origem: core/pacientes/paciente.model.ts (Angular), copiado campo a campo.

export interface Paciente {
  id: number;
  nome: string;
  email: string;
  profissionalId: number | null;
  profissionalNome: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  profissao: string | null;
  telefone: string | null;
  endereco: string | null;
  bairro: string | null;
  foto: string | null;
  dataCriacao: string;
}

export interface PacienteCreateRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface PacienteUpdateRequest {
  nome: string;
  email: string;
  senha: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  profissao: string | null;
  telefone: string | null;
  endereco: string | null;
  bairro: string | null;
  foto: string | null;
}

export interface PacienteAdminUpdateRequest {
  nome: string;
  email: string;
  senha: string | null;
  profissionalId: number;
}

export interface MePerfilUpdateRequest {
  nome: string;
  email: string;
  dataNascimento: string | null;
  sexo: string | null;
  profissao: string | null;
  telefone: string | null;
  endereco: string | null;
  bairro: string | null;
  foto: string | null;
}
