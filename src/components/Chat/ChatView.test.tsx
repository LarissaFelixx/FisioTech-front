import { HeaderHeightContext } from '@react-navigation/elements';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { networkError } from '../../test/helpers';
import type { Mensagem } from '../../types/mensagem';
import { ChatView } from './ChatView';

const primeira: Mensagem = {
  id: 1,
  pacienteId: 42,
  profissionalId: 1,
  autor: 'PACIENTE',
  conteudo: 'Olá!',
  dataEnvio: '2026-10-05T10:00:00',
};
const props = {
  autor: 'PROFISSIONAL' as const,
  loading: false,
  error: null,
  refreshing: false,
  onRefresh: jest.fn(),
  onSend: jest.fn(async () => undefined),
};
function tela(mensagens: Mensagem[], error: unknown = null) {
  return (
    <HeaderHeightContext.Provider value={60}>
      <ChatView {...props} mensagens={mensagens} error={error} />
    </HeaderHeightContext.Provider>
  );
}

it('preserva o histórico em falha de atualização e oferece nova tentativa', async () => {
  await render(tela([primeira], networkError()));
  expect(screen.getByTestId('mensagem-1')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Tentar novamente'));
  expect(props.onRefresh).toHaveBeenCalled();
  expect(screen.getByTestId('chat-input')).toHaveProp('editable', true);
});

it('avisa sobre novas mensagens quando o usuário está lendo o histórico', async () => {
  const { rerender } = await render(tela([primeira]));
  await fireEvent.scroll(screen.getByTestId('chat-history'), {
    nativeEvent: {
      contentOffset: { y: 0 },
      contentSize: { height: 2000 },
      layoutMeasurement: { height: 500 },
    },
  });
  await rerender(
    tela([primeira, { ...primeira, id: 2, conteudo: 'Como está?', autor: 'PROFISSIONAL' }]),
  );
  expect(screen.getByTestId('chat-new-messages')).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId('chat-new-messages'));
  expect(screen.queryByTestId('chat-new-messages')).toBeNull();
});
