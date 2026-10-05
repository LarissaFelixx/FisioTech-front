import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';
import { formatDataHoraBr, parseDataHora } from '../../utils/date';
import { Avatar } from '../Avatar/Avatar';
import { ErrorState } from '../ErrorState/ErrorState';
import { Icon } from '../Icon/Icon';
import { Skeleton } from '../Skeleton/Skeleton';
import { mensagemErroChat } from './chatLogic';

export type ConversationItem = {
  id: number;
  nome: string;
  ultimaMensagem: string | null;
  dataUltimaMensagem: string | null;
};
type Props = {
  items: ConversationItem[];
  loading: boolean;
  error: unknown;
  refreshing: boolean;
  onRefresh: () => unknown;
  onOpen: (item: ConversationItem) => void;
  emptyMessage: string;
};

export function ConversationList({
  items,
  loading,
  error,
  refreshing,
  onRefresh,
  onOpen,
  emptyMessage,
}: Props) {
  const sorted = [...items].sort(
    (a, b) =>
      (b.dataUltimaMensagem ? parseDataHora(b.dataUltimaMensagem).getTime() : 0) -
        (a.dataUltimaMensagem ? parseDataHora(a.dataUltimaMensagem).getTime() : 0) || a.id - b.id,
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={sorted}
        testID="chat-inbox"
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              Conversas
            </Text>
            {error ? (
              <ErrorState
                message={mensagemErroChat(error)}
                onRetry={() => void onRefresh()}
                retrying={refreshing}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Skeleton variant="list" count={4} />
          ) : !error ? (
            <Text style={styles.empty}>{emptyMessage}</Text>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing && !loading}
            onRefresh={() => void onRefresh()}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            testID={`conversa-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Conversar com ${item.nome}`}
            onPress={() => onOpen(item)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <Avatar nome={item.nome} />
            <View style={styles.info}>
              <Text numberOfLines={1} style={styles.name}>
                {item.nome}
              </Text>
              <Text numberOfLines={2} style={styles.preview}>
                {item.ultimaMensagem ?? 'Iniciar conversa'}
              </Text>
              {item.dataUltimaMensagem ? (
                <Text style={styles.date}>
                  {formatDataHoraBr(parseDataHora(item.dataUltimaMensagem))}
                </Text>
              ) : null}
            </View>
            <Icon name="chevron-right" color={colors.textSecondary} size={20} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: fontSizes.xxl, fontFamily: fonts.extrabold },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    paddingVertical: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: { flex: 1, gap: spacing.xs },
  name: { color: colors.text, fontFamily: fonts.semibold, fontSize: fontSizes.base },
  preview: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSizes.md },
  date: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSizes.xs },
  pressed: { opacity: 0.7 },
});
