import { toApiError } from '../../api/errors';
import { CadastroSemLoginError } from '../../contexts/AuthContext';

export const MENSAGEM_SEM_CONEXAO =
  'Sem conexão com o servidor. Verifique sua internet e tente novamente.';

/** Mensagens do `login.ts` do Angular, mais a de falha de rede. */
export function mensagemErroLogin(error: unknown): string {
  const apiError = toApiError(error);
  if (apiError.kind === 'http' && apiError.status === 401) {
    return 'Usuário ou senha incorreta.';
  }
  if (apiError.kind === 'network') {
    return MENSAGEM_SEM_CONEXAO;
  }
  return 'Não foi possível entrar. Tente novamente.';
}

export function mensagemErroCadastro(error: unknown): string {
  if (error instanceof CadastroSemLoginError) {
    return 'Conta criada, mas não foi possível entrar automaticamente. Faça login.';
  }
  const apiError = toApiError(error);
  if (apiError.kind === 'http' && apiError.status === 409) {
    return 'Já existe uma conta com este email.';
  }
  if (apiError.kind === 'network') {
    return MENSAGEM_SEM_CONEXAO;
  }
  return 'Não foi possível criar a conta. Tente novamente.';
}
