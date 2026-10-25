import type { MePerfilUpdateRequest, Paciente } from '../../../types/paciente';
import { dataBrParaIso, formatDataBr, isoParaDataBr, parseDataHora } from '../../../utils/date';
import { mensagemDeErro } from '../../../utils/mensagensErro';
import { dataBr, email, maximo, obrigatorio, type Schema } from '../../../utils/validation';

/** Regras do Meu Perfil (#44; origem: `features/paciente/paciente-perfil` do Angular). */

export type PerfilCampos =
  'nome' | 'email' | 'dataNascimento' | 'sexo' | 'profissao' | 'telefone' | 'endereco';

export type PerfilFormValues = Record<PerfilCampos, string>;

/** Campos do formulário, na ordem do Figma ("23 Meu Perfil"). */
export function valoresDoPerfil(p: Paciente): PerfilFormValues {
  return {
    nome: p.nome,
    email: p.email,
    dataNascimento: isoParaDataBr(p.dataNascimento),
    sexo: p.sexo ?? '',
    profissao: p.profissao ?? '',
    telefone: p.telefone ?? '',
    endereco: p.endereco ?? '',
  };
}

/** Mesmas validações do Angular: nome e email obrigatórios (até 120); data opcional e válida. */
export const schemaPerfil: Partial<Schema<PerfilCampos>> = {
  nome: [obrigatorio, maximo(120)],
  email: [obrigatorio, email, maximo(120)],
  dataNascimento: [dataBr],
};

const ouNulo = (v: string) => v.trim() || null;

/**
 * Corpo do `PUT /me`. O backend substitui o perfil inteiro, então `bairro` e `foto` (que o Figma
 * não mostra) vão com o valor atual, para não serem apagados.
 */
export function montarPerfil(v: PerfilFormValues, atual: Paciente): MePerfilUpdateRequest {
  return {
    nome: v.nome.trim(),
    email: v.email.trim(),
    dataNascimento: dataBrParaIso(v.dataNascimento),
    sexo: v.sexo || null,
    profissao: ouNulo(v.profissao),
    telefone: ouNulo(v.telefone),
    endereco: ouNulo(v.endereco),
    bairro: atual.bairro,
    foto: atual.foto,
  };
}

/** "Cadastrado em 12/03/2025". */
export function cadastradoEm(p: Paciente): string {
  return `Cadastrado em ${formatDataBr(parseDataHora(p.dataCriacao))}`;
}

export const MENSAGEM_PERFIL_SALVO = 'Perfil atualizado com sucesso.';

export function mensagemErroPerfil(error: unknown): string {
  return mensagemDeErro(
    error,
    { 409: 'Já existe uma conta com este email.' },
    'Não foi possível salvar. Tente novamente.',
  );
}
