import { toApiError } from '../api/errors';

export const MENSAGEM_SEM_CONEXAO =
  'Sem conexão com o servidor. Verifique sua internet e tente novamente.';

/** 403 do backend ("Acesso negado."): o perfil logado não pode fazer isso. Não desloga. */
export const MENSAGEM_SEM_PERMISSAO = 'Você não tem permissão para fazer isso.';

/**
 * Traduz um erro de API numa mensagem para a tela: usa a mensagem do status HTTP, se houver,
 * a de falta de permissão para 403, a de falta de conexão para erros de rede e, nos demais
 * casos, a mensagem padrão.
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
  if (apiError.kind === 'http' && apiError.status === 403) {
    return MENSAGEM_SEM_PERMISSAO;
  }
  if (apiError.kind === 'network') {
    return MENSAGEM_SEM_CONEXAO;
  }
  return padrao;
}
