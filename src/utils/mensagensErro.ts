import { toApiError } from '../api/errors';

export const MENSAGEM_SEM_CONEXAO =
  'Sem conexão com o servidor. Verifique sua internet e tente novamente.';

/**
 * Traduz um erro de API numa mensagem para a tela: usa a mensagem do status HTTP, se houver,
 * a de falta de conexão para erros de rede e, nos demais casos, a mensagem padrão.
 */
export function mensagemDeErro(
  error: unknown,
  porStatus: Record<number, string>,
  padrao: string,
): string {
  const apiError = toApiError(error);
  if (apiError.kind === 'http' && porStatus[apiError.status]) {
    return porStatus[apiError.status];
  }
  if (apiError.kind === 'network') {
    return MENSAGEM_SEM_CONEXAO;
  }
  return padrao;
}
