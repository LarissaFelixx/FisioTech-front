import type { Paciente, PacienteCreateRequest, PacienteUpdateRequest } from '../../types/paciente';
import { dataBrParaIso, isoParaDataBr } from '../../utils/date';
import { mensagemDeErro } from '../../utils/mensagensErro';
import { dataBr, email, maximo, minimo, obrigatorio, type Schema } from '../../utils/validation';

/** Regras de `features/pacientes` do Angular (lista e formulário), como funções puras. */

/** Filtro da lista: nome ou email contendo o termo, sem diferenciar maiúsculas. */
export function filtrarPacientes(pacientes: Paciente[], termo: string): Paciente[] {
  const t = termo.trim().toLowerCase();
  if (!t) {
    return pacientes;
  }
  return pacientes.filter(
    (p) => p.nome.toLowerCase().includes(t) || p.email.toLowerCase().includes(t),
  );
}

export const SEXO_OPCOES = [
  { valor: '', label: 'Não informado' },
  { valor: 'Feminino', label: 'Feminino' },
  { valor: 'Masculino', label: 'Masculino' },
  { valor: 'Outro', label: 'Outro' },
];

export type PacienteCampos =
  | 'nome'
  | 'email'
  | 'senha'
  | 'dataNascimento'
  | 'sexo'
  | 'profissao'
  | 'telefone'
  | 'endereco'
  | 'bairro'
  | 'foto';

export type PacienteFormValues = Record<PacienteCampos, string>;

export const VALORES_VAZIOS: PacienteFormValues = {
  nome: '',
  email: '',
  senha: '',
  dataNascimento: '',
  sexo: '',
  profissao: '',
  telefone: '',
  endereco: '',
  bairro: '',
  foto: '',
};

export function valoresDoPaciente(p: Paciente): PacienteFormValues {
  return {
    nome: p.nome,
    email: p.email,
    senha: '',
    dataNascimento: isoParaDataBr(p.dataNascimento),
    sexo: p.sexo ?? '',
    profissao: p.profissao ?? '',
    telefone: p.telefone ?? '',
    endereco: p.endereco ?? '',
    bairro: p.bairro ?? '',
    foto: p.foto ?? '',
  };
}

/** Senha obrigatória só no cadastro; na edição, em branco mantém a atual (F-01). */
export function schemaPaciente(editando: boolean): Partial<Schema<PacienteCampos>> {
  return {
    nome: [obrigatorio, maximo(120)],
    email: [obrigatorio, email, maximo(120)],
    senha: editando ? [minimo(8), maximo(100)] : [obrigatorio, minimo(8), maximo(100)],
    dataNascimento: [dataBr],
  };
}

/** O backend só aceita nome, email e senha no cadastro (`PacienteCreateRequest`). */
export function montarCriacao(v: PacienteFormValues): PacienteCreateRequest {
  return { nome: v.nome.trim(), email: v.email.trim(), senha: v.senha };
}

const ouNulo = (valor: string) => (valor.trim() ? valor.trim() : null);

export function montarAtualizacao(v: PacienteFormValues): PacienteUpdateRequest {
  return {
    nome: v.nome.trim(),
    email: v.email.trim(),
    senha: v.senha.trim() ? v.senha : null,
    dataNascimento: dataBrParaIso(v.dataNascimento),
    sexo: ouNulo(v.sexo),
    profissao: ouNulo(v.profissao),
    telefone: ouNulo(v.telefone),
    endereco: ouNulo(v.endereco),
    bairro: ouNulo(v.bairro),
    foto: ouNulo(v.foto),
  };
}

export function mensagemErroSalvar(error: unknown): string {
  return mensagemDeErro(
    error,
    { 409: 'Já existe um paciente cadastrado com este email.' },
    'Não foi possível salvar. Confira os dados e tente novamente.',
  );
}

/** 409: o backend recusa excluir paciente com registros associados (decisão do Batch 3). */
export function mensagemErroExcluir(error: unknown): string {
  return mensagemDeErro(
    error,
    { 409: 'Este paciente tem consultas ou mensagens e não pode ser excluído.' },
    'Não foi possível excluir o paciente.',
  );
}
