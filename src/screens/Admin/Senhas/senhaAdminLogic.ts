import type { Paciente, PacienteAdminUpdateRequest } from '../../../types/paciente';
import type { Profissional, ProfissionalUpdateRequest } from '../../../types/profissional';
import { mensagemDeErro } from '../../../utils/mensagensErro';
import { maximo, minimo, obrigatorio, type Schema } from '../../../utils/validation';

export type TipoContaSenha = 'paciente' | 'profissional';
export type ContaSenha = { tipo: TipoContaSenha; id: number; nome: string; email: string };
export type SenhaAdminCampo = 'senha' | 'confirmacao';

export class PacienteSemResponsavelError extends Error {
  constructor() {
    super('Defina o profissional responsável na edição do paciente antes de criar sua senha.');
    this.name = 'PacienteSemResponsavelError';
  }
}

export function schemaSenhaAdmin(senha: string): Schema<SenhaAdminCampo> {
  return {
    senha: [obrigatorio, minimo(8), maximo(100)],
    confirmacao: [obrigatorio, (valor) => (valor === senha ? null : 'As senhas devem ser iguais.')],
  };
}

/** A API exige o perfil completo: manter os dados recebidos, sem reformatar ou deduplicar. */
export function senhaProfissionalRequest(
  profissional: Profissional,
  senha: string,
): ProfissionalUpdateRequest {
  return {
    nome: profissional.nome,
    email: profissional.email,
    senha,
    registroProfissional: profissional.registroProfissional,
    especialidade: profissional.especialidade,
    valorConsultaParticular: profissional.valorConsultaParticular,
    conveniosAceitos: profissional.conveniosAceitos,
    foto: profissional.foto,
    dataNascimento: profissional.dataNascimento,
    sexo: profissional.sexo,
    telefone: profissional.telefone,
  };
}

export function senhaPacienteRequest(
  paciente: Paciente,
  senha: string,
): PacienteAdminUpdateRequest {
  if (paciente.profissionalId === null) {
    throw new PacienteSemResponsavelError();
  }
  return {
    nome: paciente.nome,
    email: paciente.email,
    senha,
    profissionalId: paciente.profissionalId,
  };
}

export function mensagemErroSenhaAdmin(error: unknown): string {
  if (error instanceof PacienteSemResponsavelError) {
    return error.message;
  }
  return mensagemDeErro(
    error,
    {
      400: 'Confira os dados da conta e a nova senha. A alteração não foi aceita.',
      403: 'Você não tem permissão para definir senhas destas contas.',
      404: 'Conta não encontrada. Volte à seleção e atualize a lista.',
      409: 'Há um conflito nos dados da conta. Corrija o perfil antes de definir a senha.',
    },
    'Não foi possível definir a senha. Tente novamente.',
  );
}
