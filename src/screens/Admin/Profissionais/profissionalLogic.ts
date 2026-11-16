import type {
  Profissional,
  ProfissionalCreateRequest,
  ProfissionalUpdateRequest,
} from '../../../types/profissional';
import { dataBrParaIso, isoParaDataBr } from '../../../utils/date';
import { mensagemDeErro } from '../../../utils/mensagensErro';
import { lerValor } from '../../../utils/moeda';
import {
  dataBr,
  email,
  maximo,
  minimo,
  obrigatorio,
  valorEmReais,
  type Rule,
  type Schema,
} from '../../../utils/validation';

export type ProfissionalCampo =
  | 'nome'
  | 'email'
  | 'senha'
  | 'registroProfissional'
  | 'especialidade'
  | 'valorConsultaParticular'
  | 'conveniosAceitos'
  | 'foto'
  | 'dataNascimento'
  | 'sexo'
  | 'telefone';

export type ProfissionalFormValues = Record<ProfissionalCampo, string>;

export const PROFISSIONAL_VAZIO: ProfissionalFormValues = {
  nome: '',
  email: '',
  senha: '',
  registroProfissional: '',
  especialidade: '',
  valorConsultaParticular: '',
  conveniosAceitos: '',
  foto: '',
  dataNascimento: '',
  sexo: '',
  telefone: '',
};

const valorFinito: Rule = (valor) => {
  const numero = lerValor(valor);
  return numero !== null && !Number.isFinite(numero) ? 'Informe um valor válido em reais.' : null;
};

/** Apenas restrições do contrato: sem impor registro regional, preço mínimo ou convênio fixo. */
export function schemaProfissional(editando: boolean): Partial<Schema<ProfissionalCampo>> {
  return {
    nome: [obrigatorio, maximo(120)],
    email: [obrigatorio, email, maximo(120)],
    senha: editando ? [minimo(8), maximo(100)] : [obrigatorio, minimo(8), maximo(100)],
    registroProfissional: [obrigatorio, maximo(20)],
    especialidade: [obrigatorio, maximo(120)],
    valorConsultaParticular: [valorEmReais, valorFinito],
    dataNascimento: [dataBr],
  };
}

export function valoresDoProfissional(profissional: Profissional): ProfissionalFormValues {
  return {
    nome: profissional.nome,
    email: profissional.email,
    senha: '',
    registroProfissional: profissional.registroProfissional,
    especialidade: profissional.especialidade,
    valorConsultaParticular:
      profissional.valorConsultaParticular?.toFixed(2).replace('.', ',') ?? '',
    conveniosAceitos: profissional.conveniosAceitos.join('\n'),
    foto: profissional.foto ?? '',
    dataNascimento: isoParaDataBr(profissional.dataNascimento),
    sexo: profissional.sexo ?? '',
    telefone: profissional.telefone ?? '',
  };
}

export function lerConvenios(texto: string): string[] {
  const vistos = new Set<string>();

  return texto
    .split(/\r?\n/)
    .map((nome) => nome.trim())
    .filter((nome) => {
      const chave = nome.toLocaleLowerCase('pt-BR');
      if (!nome || vistos.has(chave)) {
        return false;
      }
      vistos.add(chave);
      return true;
    });
}

const ouNulo = (valor: string): string | null => valor.trim() || null;

export function montarAtualizacaoProfissional(
  valores: ProfissionalFormValues,
): ProfissionalUpdateRequest {
  return {
    nome: valores.nome.trim(),
    email: valores.email.trim(),
    senha: valores.senha.trim() ? valores.senha : null,
    registroProfissional: valores.registroProfissional.trim(),
    especialidade: valores.especialidade.trim(),
    valorConsultaParticular: lerValor(valores.valorConsultaParticular),
    conveniosAceitos: lerConvenios(valores.conveniosAceitos),
    foto: ouNulo(valores.foto),
    dataNascimento: dataBrParaIso(valores.dataNascimento),
    sexo: ouNulo(valores.sexo),
    telefone: ouNulo(valores.telefone),
  };
}

export function montarCriacaoProfissional(
  valores: ProfissionalFormValues,
): ProfissionalCreateRequest {
  return { ...montarAtualizacaoProfissional(valores), senha: valores.senha };
}

export function correcoesSensiveis(
  profissional: Profissional,
  valores: ProfissionalFormValues,
): string[] {
  const campos: string[] = [];
  if (profissional.email.toLowerCase() !== valores.email.trim().toLowerCase()) {
    campos.push('email de acesso');
  }
  if (profissional.registroProfissional !== valores.registroProfissional.trim()) {
    campos.push('registro profissional');
  }
  if (valores.senha.trim()) {
    campos.push('senha de acesso');
  }
  return campos;
}

export function filtrarProfissionais(profissionais: Profissional[], busca: string): Profissional[] {
  const normalizar = (texto: string) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const termo = normalizar(busca.trim());
  return profissionais.filter((profissional) =>
    [
      profissional.nome,
      profissional.email,
      profissional.registroProfissional,
      profissional.especialidade,
    ].some((valor) => normalizar(valor).includes(termo)),
  );
}

export function mensagemErroProfissional(
  error: unknown,
  operacao: 'carregar' | 'salvar' | 'excluir',
): string {
  return mensagemDeErro(
    error,
    {
      400: 'Confira os dados informados. A operação não foi aceita pelo servidor.',
      403: 'Você não tem permissão para administrar profissionais.',
      404: 'Profissional não encontrado. Atualize a lista.',
      409:
        operacao === 'excluir'
          ? 'Este profissional possui registros vinculados e não pode ser excluído.'
          : 'Email ou registro profissional já cadastrado. Informe dados únicos.',
    },
    `Não foi possível ${operacao} os dados do profissional. Tente novamente.`,
  );
}
