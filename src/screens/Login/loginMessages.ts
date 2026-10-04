import { CadastroSemLoginError } from '../../contexts/AuthContext';
import { mensagemDeErro } from '../../utils/mensagensErro';

export { MENSAGEM_SEM_CONEXAO } from '../../utils/mensagensErro';

/** Mensagens do `login.ts` do Angular, mais a de falha de rede. */
export function mensagemErroLogin(error: unknown): string {
  return mensagemDeErro(
    error,
    { 401: 'Usuário ou senha incorreta.' },
    'Não foi possível entrar. Tente novamente.',
  );
}

export function mensagemErroCadastro(error: unknown): string {
  if (error instanceof CadastroSemLoginError) {
    return 'Conta criada, mas não foi possível entrar automaticamente. Faça login.';
  }
  return mensagemDeErro(
    error,
    { 409: 'Já existe uma conta com este email.' },
    'Não foi possível criar a conta. Tente novamente.',
  );
}
