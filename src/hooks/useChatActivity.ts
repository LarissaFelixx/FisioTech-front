import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toApiError } from '../api/errors';

export const CHAT_POLL_INTERVAL_MS = 10_000;

export type ChatQueryOptions = { active?: boolean; poll?: boolean };

/** Não continua consultando uma conversa que o servidor negou ou removeu. */
export function chatRefetchInterval(query: { state: { error: unknown } }): number | false {
  const error = toApiError(query.state.error);
  if (error.kind === 'http' && (error.status === 403 || error.status === 404)) {
    return false;
  }
  return CHAT_POLL_INTERVAL_MS;
}

export function chatQueryOptions({ active = true, poll = false }: ChatQueryOptions = {}) {
  return {
    enabled: active,
    refetchInterval: poll && active ? chatRefetchInterval : false,
    refetchIntervalInBackground: false,
  } as const;
}

/** Reativar uma query stale dispara a busca ao retornar à tela ou ao aplicativo. */
export function useChatActivity(): boolean {
  const focused = useIsFocused();
  const [appState, setAppState] = useState(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);
  return focused && appState === 'active';
}
