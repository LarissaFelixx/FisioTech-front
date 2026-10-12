// Origem: core/pacientes/paciente.model.ts (Angular), copiado campo a campo.

/** Dados de perfil opcionais, compartilhados por paciente, edição e autoatendimento. */
export interface PacientePerfilOpcional {
  dataNascimento: string | null;
  sexo: string | null;
  profissao: string | null;
  telefone: string | null;
  endereco: string | null;
  bairro: string | null;
  foto: string | null;
}

/** Paciente como o backend devolve. */
export interface Paciente extends PacientePerfilOpcional {
  id: number;
  nome: string;
  email: string;
  profissionalId: number | null;
  profissionalNome: string | null;
  dataCriacao: string;
}

/** Cadastro de paciente (tela de Novo Paciente): o backend só aceita estes três campos. */
export interface PacienteCreateRequest {
  nome: string;
  email: string;
  senha: string;
}

/** Edição de paciente pelo profissional. Senha `null` mantém a senha atual. */
export interface PacienteUpdateRequest extends PacientePerfilOpcional {
  nome: string;
  email: string;
  senha: string | null;
}

/** Edição de paciente pelo administrador, incluindo o profissional responsável. */
export interface PacienteAdminUpdateRequest {
  nome: string;
  email: string;
  senha: string | null;
  profissionalId: number;
}

/** Atualização do próprio perfil pelo paciente (`/me`). */
export interface MePerfilUpdateRequest extends PacientePerfilOpcional {
  nome: string;
  email: string;
}