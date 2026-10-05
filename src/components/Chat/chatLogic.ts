import { toApiError } from '../../api/errors';
import type { Mensagem } from '../../types/mensagem';
import { parseDataHora } from '../../utils/date';
import { mensagemDeErro } from '../../utils/mensagensErro';

export function ordenarMensagens(mensagens: Mensagem[]): Mensagem[] {
  return [...mensagens].sort(
    (a, b) =>
      parseDataHora(a.dataEnvio).getTime() - parseDataHora(b.dataEnvio).getTime() || a.id - b.id,
  );
}

export function conversaIndisponivel(error: unknown): boolean {
  const erro = toApiError(error);
  return erro.kind === 'http' && (erro.status === 403 || erro.status === 404);
}

export function mensagemErroChat(error: unknown, envio = false): string {
  const erro = toApiError(error);
  if (envio && erro.kind === 'network') {
    return 'Não foi possível confirmar o envio. Atualize a conversa antes de tentar novamente.';
  }
  return mensagemDeErro(
    error,
    {
      403: 'Você não tem acesso a esta conversa.',
      404: 'Esta conversa não está disponível.',
      400: 'Não foi possível enviar. Confira a mensagem e tente novamente.',
    },
    envio
      ? 'Não foi possível enviar a mensagem. Tente novamente.'
      : 'Não foi possível atualizar as mensagens.',
  );
}
