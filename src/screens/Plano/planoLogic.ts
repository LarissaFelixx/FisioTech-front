import type { PlanoCreateRequest, PlanoTerapeutico } from '../../types/plano';
import { dataBrParaIso, formatDataBr, isoParaDataBr } from '../../utils/date';
import { mensagemDeErro } from '../../utils/mensagensErro';
import {
  dataBr,
  maximo,
  obrigatorio,
  validarFormulario,
  type Schema,
} from '../../utils/validation';

/** Limite de `objetivos` e `condutas` no backend. */
export const MAX_TEXTO = 4000;

export const MENSAGEM_ERRO_CARREGAR = 'Não foi possível carregar o plano terapêutico.';
export const MENSAGEM_ERRO_SALVAR = 'Não foi possível salvar o plano terapêutico.';
export const MENSAGEM_FIM_ANTES_INICIO = 'A data final não pode ser anterior à data inicial.';

export interface PlanoForm {
  objetivos: string;
  condutas: string;
  /** DD/MM/AAAA */
  dataInicio: string;
  /** DD/MM/AAAA (opcional) */
  dataFimPrevista: string;
  visivelPaciente: boolean;
}

type CampoTexto = Exclude<keyof PlanoForm, 'visivelPaciente'>;
export type ErrosPlano = Partial<Record<CampoTexto, string>>;

const schemaPlano: Schema<CampoTexto> = {
  objetivos: [obrigatorio, maximo(MAX_TEXTO)],
  condutas: [obrigatorio, maximo(MAX_TEXTO)],
  dataInicio: [obrigatorio, dataBr],
  dataFimPrevista: [dataBr],
};

/** Revisão usada para pré-preencher: a ATIVA ou, sem ela, a de maior revisão. */
export function planoParaPreencher(planos: PlanoTerapeutico[]): PlanoTerapeutico | null {
  const ativo = planos.find((p) => p.status === 'ATIVO');
  if (ativo) {
    return ativo;
  }
  return planos.reduce<PlanoTerapeutico | null>(
    (maior, p) => (!maior || p.revisao > maior.revisao ? p : maior),
    null,
  );
}

/** Formulário a partir do plano atual; sem plano, começa vazio com início hoje e visível. */
export function formDoPlano(plano: PlanoTerapeutico | null, hoje: Date): PlanoForm {
  if (!plano) {
    return {
      objetivos: '',
      condutas: '',
      dataInicio: formatDataBr(hoje),
      dataFimPrevista: '',
      visivelPaciente: true,
    };
  }
  return {
    objetivos: plano.objetivos,
    condutas: plano.condutas,
    dataInicio: isoParaDataBr(plano.dataInicio),
    dataFimPrevista: isoParaDataBr(plano.dataFimPrevista),
    visivelPaciente: plano.visivelPaciente,
  };
}

/** Erros por campo; a previsão de término não pode ser anterior ao início. */
export function validarPlano(form: PlanoForm): ErrosPlano {
  const erros: ErrosPlano = validarFormulario<CampoTexto>(form, schemaPlano);
  if (!erros.dataInicio && !erros.dataFimPrevista) {
    const inicio = dataBrParaIso(form.dataInicio);
    const fim = dataBrParaIso(form.dataFimPrevista);
    // `AAAA-MM-DD` compara na ordem cronológica.
    if (inicio && fim && fim < inicio) {
      erros.dataFimPrevista = MENSAGEM_FIM_ANTES_INICIO;
    }
  }
  return erros;
}

export function montarPlano(form: PlanoForm): PlanoCreateRequest {
  const dataInicio = dataBrParaIso(form.dataInicio);
  if (!dataInicio) {
    throw new Error('Data de início inválida.');
  }
  return {
    objetivos: form.objetivos.trim(),
    condutas: form.condutas.trim(),
    dataInicio,
    dataFimPrevista: dataBrParaIso(form.dataFimPrevista),
    visivelPaciente: form.visivelPaciente,
  };
}

export function mensagemErroSalvar(error: unknown): string {
  return mensagemDeErro(
    error,
    {
      400: 'Verifique os dados do plano.',
      404: 'Paciente não encontrado.',
      // Estado inválido no backend: término antes do início.
      409: MENSAGEM_FIM_ANTES_INICIO,
      422: MENSAGEM_FIM_ANTES_INICIO,
    },
    MENSAGEM_ERRO_SALVAR,
  );
}
