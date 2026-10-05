import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { httpError, networkError } from '../../test/helpers';
import type { Mensagem } from '../../types/mensagem';
import { conversaIndisponivel, mensagemErroChat, ordenarMensagens } from './chatLogic';
import { MessageComposer } from './MessageComposer';

describe('envio de mensagem', () => {
  it('bloqueia conteúdo vazio e limpa o texto somente depois da confirmação', async () => {
    let confirmar!: () => void;
    const onSend = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          confirmar = resolve;
        }),
    );
    const onSent = jest.fn();
    await render(<MessageComposer onSend={onSend} onSent={onSent} />);
    expect(screen.getByTestId('chat-send')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('chat-input'), '   ');
    expect(screen.getByTestId('chat-send')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('chat-input'), ' Olá! ');
    await fireEvent.press(screen.getByTestId('chat-send'));
    await fireEvent.press(screen.getByTestId('chat-send'));
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith('Olá!');
    expect(screen.getByTestId('chat-input')).toHaveProp('value', ' Olá! ');
    expect(screen.getByTestId('chat-input')).toHaveProp('editable', false);
    await act(async () => confirmar());
    await waitFor(() => expect(screen.getByTestId('chat-input')).toHaveProp('value', ''));
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('mantém o texto e permite nova tentativa manual se o envio falhar', async () => {
    const onSend = jest.fn().mockRejectedValueOnce(networkError()).mockResolvedValue(undefined);
    await render(<MessageComposer onSend={onSend} onSent={jest.fn()} />);
    await fireEvent.changeText(screen.getByTestId('chat-input'), 'Estou melhor');
    await fireEvent.press(screen.getByTestId('chat-send'));
    expect(await screen.findByTestId('chat-send-error')).toHaveTextContent(/Atualize a conversa/);
    expect(screen.getByTestId('chat-input')).toHaveProp('value', 'Estou melhor');
    expect(onSend).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('chat-send'));
    await waitFor(() => expect(screen.getByTestId('chat-input')).toHaveProp('value', ''));
    expect(onSend).toHaveBeenCalledTimes(2);
  });
});

describe('histórico e erros', () => {
  it('ordena por data e id sem alterar a lista recebida', () => {
    const mensagens = [
      { id: 3, dataEnvio: '2026-10-05T10:01:00' },
      { id: 2, dataEnvio: '2026-10-05T10:00:00' },
      { id: 1, dataEnvio: '2026-10-05T10:00:00' },
    ] as Mensagem[];
    expect(ordenarMensagens(mensagens).map((m) => m.id)).toEqual([1, 2, 3]);
    expect(mensagens.map((m) => m.id)).toEqual([3, 2, 1]);
  });
  it('distingue acesso negado e conversa removida de falhas temporárias', () => {
    expect(conversaIndisponivel(httpError(403))).toBe(true);
    expect(conversaIndisponivel(httpError(404))).toBe(true);
    expect(conversaIndisponivel(networkError())).toBe(false);
    expect(mensagemErroChat(httpError(403))).toBe('Você não tem acesso a esta conversa.');
  });
});
