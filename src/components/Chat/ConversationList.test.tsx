import { fireEvent, render, screen } from '@testing-library/react-native';

import { httpError, networkError } from '../../test/helpers';
import { ConversationList } from './ConversationList';
import { conversasVisiveis, previaMensagem, type ConversationItem } from './inboxLogic';

const maria: ConversationItem = {
  id: 1,
  nome: 'Maria Souza',
  ultimaMensagem: 'Como está a recuperação?',
  ultimoAutor: 'PROFISSIONAL',
  dataUltimaMensagem: '2026-10-08T09:00:00',
};
const joao: ConversationItem = {
  id: 2,
  nome: 'João Lima',
  ultimaMensagem: 'Estou melhor',
  ultimoAutor: 'PACIENTE',
  dataUltimaMensagem: '2026-10-08T10:00:00',
};
const semMensagem: ConversationItem = {
  id: 3,
  nome: 'Ana',
  ultimaMensagem: null,
  ultimoAutor: null,
  dataUltimaMensagem: null,
};
const props = {
  items: [maria, joao, semMensagem],
  autor: 'PROFISSIONAL' as const,
  loading: false,
  error: null,
  refreshing: false,
  onRefresh: jest.fn(),
  onOpen: jest.fn(),
  emptyMessage: 'Nenhuma conversa disponível.',
};

beforeEach(() => jest.clearAllMocks());

describe('regras da caixa de entrada', () => {
  it('ordena por mensagem mais recente, deixa conversas sem mensagem por último e preserva a entrada', () => {
    const entrada = [semMensagem, maria, joao];
    expect(conversasVisiveis(entrada, '').map((c) => c.id)).toEqual([2, 1, 3]);
    expect(entrada.map((c) => c.id)).toEqual([3, 1, 2]);
    expect(conversasVisiveis([{ ...maria, id: 8 }, maria], '').map((c) => c.id)).toEqual([1, 8]);
  });
  it('filtra por nome ou mensagem ignorando acentos, caixa e espaços externos', () => {
    expect(conversasVisiveis(props.items, ' JOAO ')).toEqual([joao]);
    expect(conversasVisiveis(props.items, 'RECUPERACAO')).toEqual([maria]);
    expect(conversasVisiveis(props.items, '   ')).toHaveLength(3);
  });
  it('identifica mensagens próprias nos dois perfis e trata ausência de texto', () => {
    expect(previaMensagem(maria, 'PROFISSIONAL')).toBe('Você: Como está a recuperação?');
    expect(previaMensagem(joao, 'PACIENTE')).toBe('Você: Estou melhor');
    expect(previaMensagem(joao, 'PROFISSIONAL')).toBe('Estou melhor');
    expect(previaMensagem({ ...semMensagem, ultimaMensagem: '   ' }, 'PACIENTE')).toBe(
      'Iniciar conversa',
    );
  });
});

describe('interface da caixa de entrada', () => {
  it('mostra dados, autoria, total e abre o item correto', async () => {
    await render(<ConversationList {...props} />);
    expect(screen.getByText('Caixa de entrada · Pacientes')).toBeOnTheScreen();
    expect(screen.getByText('Você: Como está a recuperação?')).toBeOnTheScreen();
    expect(screen.getByText('08/10/2026 10:00')).toBeOnTheScreen();
    expect(screen.getByText('Iniciar conversa')).toBeOnTheScreen();
    expect(screen.getByTestId('inbox-count')).toHaveTextContent('3 conversas');
    await fireEvent.press(screen.getByTestId('conversa-2'));
    expect(props.onOpen).toHaveBeenCalledWith(joao);
  });
  it('busca, mostra ausência de resultados e restaura a lista ao limpar', async () => {
    await render(<ConversationList {...props} />);
    await fireEvent.changeText(screen.getByTestId('inbox-search'), 'JOAO');
    expect(screen.getByTestId('conversa-2')).toBeOnTheScreen();
    expect(screen.queryByTestId('conversa-1')).toBeNull();
    expect(screen.getByTestId('inbox-count')).toHaveTextContent('1 de 3 conversas');
    await fireEvent.changeText(screen.getByTestId('inbox-search'), 'inexistente');
    expect(screen.getByText('Nenhuma conversa encontrada para esta busca.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('inbox-clear-search'));
    expect(screen.getByTestId('inbox-search')).toHaveProp('value', '');
    expect(screen.getByTestId('conversa-1')).toBeOnTheScreen();
    expect(screen.getByTestId('conversa-2')).toBeOnTheScreen();
  });
  it('separa carregamento, caixa vazia e erro inicial', async () => {
    const { rerender } = await render(<ConversationList {...props} items={[]} loading />);
    expect(screen.queryByText(props.emptyMessage)).toBeNull();
    expect(screen.queryByTestId('inbox-count')).toBeNull();
    await rerender(<ConversationList {...props} items={[]} />);
    expect(screen.getByText(props.emptyMessage)).toBeOnTheScreen();
    await rerender(<ConversationList {...props} items={[]} error={networkError()} />);
    expect(screen.queryByText(props.emptyMessage)).toBeNull();
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });
  it('preserva conversas em erro de atualização e permite puxar para atualizar', async () => {
    await render(<ConversationList {...props} error={networkError()} />);
    expect(screen.getByTestId('conversa-1')).toBeOnTheScreen();
    expect(screen.getByTestId('conversa-2')).toBeOnTheScreen();
    expect(screen.getByTestId('error-state')).toBeOnTheScreen();
    await fireEvent(screen.getByTestId('chat-inbox'), 'refresh');
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });
  it('oculta dados e busca após acesso negado, mesmo com dados anteriores', async () => {
    await render(<ConversationList {...props} error={httpError(403)} />);
    expect(screen.getByText('Você não tem acesso à caixa de entrada.')).toBeOnTheScreen();
    expect(screen.queryByTestId('conversa-1')).toBeNull();
    expect(screen.queryByTestId('inbox-search')).toBeNull();
    expect(screen.queryByTestId('inbox-count')).toBeNull();
  });
});
