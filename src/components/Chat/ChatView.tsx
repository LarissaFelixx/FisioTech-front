import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSizes, fonts, spacing } from '../../theme';
import type { AutorMensagem, Mensagem } from '../../types/mensagem';
import { formatDataBr, mesmoDia, parseDataHora } from '../../utils/date';
import { Button } from '../Button/Button';
import { ErrorState } from '../ErrorState/ErrorState';
import { Skeleton } from '../Skeleton/Skeleton';
import { conversaIndisponivel, mensagemErroChat, ordenarMensagens } from './chatLogic';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

type Props = {
  mensagens: Mensagem[] | undefined;
  autor: AutorMensagem;
  loading: boolean;
  error: unknown;
  refreshing: boolean;
  onRefresh: () => unknown;
  onSend: (conteudo: string) => Promise<unknown>;
};

export function ChatView({
  mensagens,
  autor,
  loading,
  error,
  refreshing,
  onRefresh,
  onSend,
}: Props) {
  const headerHeight = useHeaderHeight();
  const ordenadas = useMemo(() => ordenarMensagens(mensagens ?? []), [mensagens]);
  const lista = useRef<FlatList<Mensagem>>(null);
  const nearEnd = useRef(true);
  const previousIds = useRef<Set<number>>(new Set());
  const receivedHistory = useRef(false);
  const scrollPending = useRef(true);
  const [novas, setNovas] = useState(false);

  function irAoFinal() {
    nearEnd.current = true;
    scrollPending.current = true;
    setNovas(false);
    lista.current?.scrollToEnd({ animated: true });
  }

  useEffect(() => {
    if (mensagens === undefined) return;
    const added = ordenadas.some((m) => !previousIds.current.has(m.id));
    if (!receivedHistory.current || (added && nearEnd.current)) {
      scrollPending.current = true;
      lista.current?.scrollToEnd({ animated: false });
    } else if (added) {
      setNovas(true);
    }
    receivedHistory.current = true;
    previousIds.current = new Set(ordenadas.map((m) => m.id));
  }, [mensagens, ordenadas]);

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    nearEnd.current = contentSize.height - layoutMeasurement.height - contentOffset.y < 100;
    if (!nearEnd.current) scrollPending.current = false;
    if (nearEnd.current) setNovas(false);
  }

  const blocked = conversaIndisponivel(error);
  const initialError = error && mensagens === undefined;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        {error ? (
          <ErrorState
            message={mensagemErroChat(error)}
            onRetry={blocked ? undefined : () => void onRefresh()}
            retrying={refreshing}
          />
        ) : null}
        <FlatList
          ref={lista}
          testID="chat-history"
          data={blocked ? [] : ordenadas}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.history}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={32}
          onContentSizeChange={() => {
            if (scrollPending.current) {
              lista.current?.scrollToEnd({ animated: false });
              scrollPending.current = false;
            }
          }}
          onLayout={() => {
            if (nearEnd.current) lista.current?.scrollToEnd({ animated: false });
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing && !loading}
              onRefresh={() => void onRefresh()}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            loading ? (
              <Skeleton variant="list" count={3} />
            ) : !initialError && !blocked ? (
              <Text style={styles.empty}>Nenhuma mensagem ainda. Inicie a conversa.</Text>
            ) : null
          }
          renderItem={({ item, index }) => {
            const data = parseDataHora(item.dataEnvio);
            const anterior = ordenadas[index - 1];
            const novoDia = !anterior || !mesmoDia(data, parseDataHora(anterior.dataEnvio));
            return (
              <View>
                {novoDia ? <Text style={styles.day}>{formatDataBr(data)}</Text> : null}
                <MessageBubble mensagem={item} propria={item.autor === autor} />
              </View>
            );
          }}
        />
        {novas ? (
          <Button
            label="Novas mensagens"
            variant="secondary"
            onPress={irAoFinal}
            testID="chat-new-messages"
          />
        ) : null}
        <MessageComposer
          onSend={onSend}
          onSent={irAoFinal}
          disabled={blocked || loading || !!initialError}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  history: { flexGrow: 1, padding: spacing.lg },
  day: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
});
