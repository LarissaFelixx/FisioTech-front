import type { Consulta } from '../../types/consulta';
import type { EvolucaoCreateRequest } from '../../types/evolucao';
import { formatDiaMes, formatHora, parseDataHora } from '../../utils/date';
import { mensagemDeErro } from '../../utils/mensagensErro';
import { maximo, obrigatorio, validar } from '../../utils/validation';

export const MAX_TEXTO = 2000;

export const MENSAGEM_ERRO_REGISTRAR = 'Não foi possível registrar a evolução.';

export interface EvolucaoForm {
  observacoes: string;
  procedimentos: string;
  respostaPaciente: string;
  conduta: string;
  visivelPaciente: boolean;
}

export const FORM_VAZIO: EvolucaoForm = {
  observacoes: '',
  procedimentos: '',
  respostaPaciente: '',
  conduta: '',
  visivelPaciente: true,
};

/** "Marcos Coelho · consulta de 22/08 09:00" */
export function subtituloEvolucao(c: Consulta): string {
  const data = parseDataHora(c.dataHora);
  return `${c.pacienteNome} · consulta de ${formatDiaMes(data)} ${formatHora(data)}`;
}

/** Só as observações são obrigatórias (`observacoes` não aceita nulo no backend). */
export function erroObservacoes(form: EvolucaoForm): string | null {
  return validar(form.observacoes, [obrigatorio, maximo(MAX_TEXTO)]);
}

/** Texto opcional: vazio (ou só espaços) vira `null`. */
const opcional = (v: string): string | null => v.trim() || null;

export function montarEvolucao(consultaId: number, form: EvolucaoForm): EvolucaoCreateRequest {
  return {
    consultaId,
    observacoes: form.observacoes.trim(),
    procedimentos: opcional(form.procedimentos),
    respostaPaciente: opcional(form.respostaPaciente),
    conduta: opcional(form.conduta),
    visivelPaciente: form.visivelPaciente,
  };
}

export function mensagemErroRegistrar(error: unknown): string {
  return mensagemDeErro(
    error,
    { 400: 'Verifique os dados da evolução.', 404: 'Paciente ou consulta não encontrado.' },
    MENSAGEM_ERRO_REGISTRAR,
  );
}
