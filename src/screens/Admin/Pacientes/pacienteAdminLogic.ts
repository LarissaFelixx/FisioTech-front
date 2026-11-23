import type { Paciente, PacienteAdminUpdateRequest } from '../../../types/paciente';
import type { Profissional } from '../../../types/profissional';
import { mensagemDeErro } from '../../../utils/mensagensErro';
import { email, maximo, minimo, obrigatorio, type Schema } from '../../../utils/validation';

export type PacienteAdminCampo = 'nome' | 'email' | 'senha' | 'profissionalId';
export type PacienteAdminValores = Record<PacienteAdminCampo, string>;

export function valoresPacienteAdmin(paciente: Paciente): PacienteAdminValores {
  return {
    nome: paciente.nome,
    email: paciente.email,
    senha: '',
    profissionalId: paciente.profissionalId === null ? '' : String(paciente.profissionalId),
  };
}

export function schemaPacienteAdmin(profissionais: Profissional[]): Schema<PacienteAdminCampo> {
  return {
    nome: [obrigatorio, maximo(120)],
    email: [obrigatorio, email, maximo(120)],
    senha: [minimo(8), maximo(100)],
    profissionalId: [
      obrigatorio,
      (valor) =>
        profissionais.some((profissional) => String(profissional.id) === valor)
          ? null
          : 'Selecione um profissional disponível.',
    ],
  };
}

export function montarAtualizacaoPacienteAdmin(
  valores: PacienteAdminValores,
): PacienteAdminUpdateRequest {
  return {
    nome: valores.nome.trim(),
    email: valores.email.trim(),
    senha: valores.senha.trim() ? valores.senha : null,
    profissionalId: Number(valores.profissionalId),
  };
}

export function correcoesPacienteAdmin(
  paciente: Paciente,
  valores: PacienteAdminValores,
): string[] {
  const correcoes: string[] = [];
  if (paciente.email.toLowerCase() !== valores.email.trim().toLowerCase()) {
    correcoes.push('email de acesso');
  }
  if (valores.senha.trim()) {
    correcoes.push('senha de acesso');
  }
  if (paciente.profissionalId !== Number(valores.profissionalId)) {
    correcoes.push('profissional responsável');
  }
  return correcoes;
}

export function filtrarPacientesAdmin(pacientes: Paciente[], busca: string): Paciente[] {
  const normalizar = (texto: string) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const termo = normalizar(busca.trim());

  return pacientes.filter((paciente) =>
    [paciente.nome, paciente.email, paciente.profissionalNome ?? ''].some((texto) =>
      normalizar(texto).includes(termo),
    ),
  );
}

export function mensagemErroPacienteAdmin(error: unknown): string {
  return mensagemDeErro(
    error,
    {
      400: 'Confira os dados informados. A operação não foi aceita pelo servidor.',
      403: 'Você não tem permissão para administrar pacientes.',
      404: 'Paciente ou profissional não encontrado. Atualize os dados e tente novamente.',
      409: 'Email já cadastrado. Informe um email único.',
    },
    'Não foi possível carregar ou salvar os dados do paciente. Tente novamente.',
  );
}
