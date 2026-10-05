import { useIsFocused } from '@react-navigation/native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import type { ReactNode } from 'react';

import { mensagemService } from '../services/mensagemService';
import { createTestQueryClient, httpError, Providers } from '../test/helpers';
import { CHAT_POLL_INTERVAL_MS, chatRefetchInterval, useChatActivity } from './useChatActivity';
import { useConversaComPaciente } from './useMensagens';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: jest.fn(() => true),
}));
jest.mock('../services/mensagemService');

const focused = jest.mocked(useIsFocused);
let changeState: (state: AppStateStatus) => void;
let remove: jest.Mock;
const originalState = AppState.currentState;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  focused.mockReturnValue(true);
  AppState.currentState = 'active';
  remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    changeState = listener;
    return { remove };
  });
  jest.mocked(mensagemService.listarPorPaciente).mockResolvedValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
  AppState.currentState = originalState;
  jest.useRealTimers();
});

it('atualiza a cada 10s, pausa fora da tela/segundo plano e busca ao voltar', async () => {
  const queryClient = createTestQueryClient();
  function wrapper({ children }: { children: ReactNode }) {
    return <Providers queryClient={queryClient}>{children}</Providers>;
  }
  const { result, rerender, unmount } = await renderHook(
    () => {
      const active = useChatActivity();
      return useConversaComPaciente(42, { active, poll: true });
    },
    { wrapper },
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(mensagemService.listarPorPaciente).toHaveBeenCalledTimes(1);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(CHAT_POLL_INTERVAL_MS);
  });
  expect(mensagemService.listarPorPaciente).toHaveBeenCalledTimes(2);

  await act(async () => changeState('background'));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(30_000);
  });
  expect(mensagemService.listarPorPaciente).toHaveBeenCalledTimes(2);
  await act(async () => changeState('active'));
  await waitFor(() => expect(mensagemService.listarPorPaciente).toHaveBeenCalledTimes(3));

  focused.mockReturnValue(false);
  await rerender({});
  await act(async () => {
    await jest.advanceTimersByTimeAsync(30_000);
  });
  expect(mensagemService.listarPorPaciente).toHaveBeenCalledTimes(3);
  focused.mockReturnValue(true);
  await rerender({});
  await waitFor(() => expect(mensagemService.listarPorPaciente).toHaveBeenCalledTimes(4));
  await unmount();
  expect(remove).toHaveBeenCalledTimes(1);
  queryClient.clear();
});

it('interrompe polling em 403/404 e mantém atualização em falhas temporárias', () => {
  expect(chatRefetchInterval({ state: { error: httpError(403) } })).toBe(false);
  expect(chatRefetchInterval({ state: { error: httpError(404) } })).toBe(false);
  expect(chatRefetchInterval({ state: { error: httpError(500) } })).toBe(CHAT_POLL_INTERVAL_MS);
});
