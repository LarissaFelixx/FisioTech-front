import { parseDataHora } from '../../utils/date';
import { mensagemDeErro } from '../../utils/mensagensErro';
import type { AutorMensagem } from '../../types/mensagem';

export type ConversationItem = {
  id: number;
  nome: string;
  ultimaMensagem: string | null;
  ultimoAutor: AutorMensagem | null;
  dataUltimaMensagem: string | null;
};

function normalizar(texto: string): string {
  return texto
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function horario(item: ConversationItem): number {
  const valor = item.dataUltimaMensagem ? parseDataHora(item.dataUltimaMensagem).getTime() : 0;
  return Number.isFinite(valor) ? valor : 0;
}

/** Filtro local: preserva o contrato HTTP e não faz requisições a cada tecla. */
export function conversasVisiveis(items: ConversationItem[], busca: string): ConversationItem[] {
  const termo = normalizar(busca);
  return items
    .filter(
      (item) =>
        !termo ||
        normalizar(item.nome).includes(termo) ||
        normalizar(item.ultimaMensagem ?? '').includes(termo),
    )
    .sort((a, b) => horario(b) - horario(a) || a.id - b.id);
}

export function previaMensagem(item: ConversationItem, autor: AutorMensagem): string {
  const texto = item.ultimaMensagem?.trim();
  if (!texto) return 'Iniciar conversa';
  return item.ultimoAutor === autor ? `Você: ${texto}` : texto;
}

export function mensagemErroCaixaEntrada(error: unknown): string {
  return mensagemDeErro(
    error,
    {
      403: 'Você não tem acesso à caixa de entrada.',
      404: 'A caixa de entrada não está disponível.',
    },
    'Não foi possível atualizar a caixa de entrada. Tente novamente.',
  );
}
