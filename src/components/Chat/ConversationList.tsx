import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';
import type { AutorMensagem } from '../../types/mensagem';
import { formatDataHoraBr, parseDataHora } from '../../utils/date';
import { Avatar } from '../Avatar/Avatar';
import { Button } from '../Button/Button';
import { ErrorState } from '../ErrorState/ErrorState';
import { Icon } from '../Icon/Icon';
import { Skeleton } from '../Skeleton/Skeleton';
import { SearchField } from '../SearchField/SearchField';
import { conversaIndisponivel } from './chatLogic';
import {
  conversasVisiveis,
  mensagemErroCaixaEntrada,
  previaMensagem,
  type ConversationItem,
} from './inboxLogic';

export type { ConversationItem } from './inboxLogic';
type Props = {
  items: ConversationItem[];
  loading: boolean;
  error: unknown;
  refreshing: boolean;
  onRefresh: () => unknown;
  onOpen: (item: ConversationItem) => void;
  emptyMessage: string;
  autor: AutorMensagem;
  /** O stack do paciente já aplica o inset superior no cabeçalho nativo. */
  nativeHeader?: boolean;
};

export function ConversationList({
  items,
  loading,
  error,
  refreshing,
  onRefresh,
  onOpen,
  emptyMessage,
  autor,
  nativeHeader = false,
}: Props) {
  const [busca, setBusca] = useState('');
  const blocked = conversaIndisponivel(error);
  const visible = useMemo(
    () => (blocked ? [] : conversasVisiveis(items, busca)),
    [items, busca, blocked],
  );
  const filtrando = !!busca.trim();
  const count = filtrando
    ? `${visible.length} de ${items.length} conversas`
    : `${items.length} ${items.length === 1 ? 'conversa' : 'conversas'}`;
  const refresh = () => void onRefresh();
  return (
    <SafeAreaView
      style={styles.safe}
      edges={nativeHeader ? ['left', 'right'] : ['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <View style={styles.heading}>
          <View style={styles.titleIcon}>
            <Icon name="chat" size={24} color={colors.primaryDark} />
          </View>
          <View style={styles.headingText}>
            <Text accessibilityRole="header" style={styles.title}>
              Conversas
            </Text>
            <Text style={styles.subtitle}>
              Caixa de entrada · {autor === 'PROFISSIONAL' ? 'Pacientes' : 'Profissionais'}
            </Text>
          </View>
        </View>
        {!blocked ? (
          <>
            <SearchField
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nome ou mensagem"
              testID="inbox-search"
            />
            {!loading && (!error || items.length > 0) ? (
              <Text style={styles.count} testID="inbox-count" accessibilityLiveRegion="polite">
                {count}
              </Text>
            ) : null}
          </>
        ) : null}
        {error ? (
          <ErrorState
            message={mensagemErroCaixaEntrada(error)}
            onRetry={() => void onRefresh()}
            retrying={refreshing}
          />
        ) : null}
      </View>
      <FlatList
        data={visible}
        testID="chat-inbox"
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          loading ? (
            <Skeleton variant="list" count={4} />
          ) : !blocked && (!error || items.length > 0) ? (
            <View style={styles.emptyCard}>
              <Icon name={filtrando ? 'search' : 'chat'} color={colors.textSecondary} size={32} />
              <Text style={styles.empty}>
                {filtrando ? 'Nenhuma conversa encontrada para esta busca.' : emptyMessage}
              </Text>
              {filtrando ? (
                <Button
                  label="Limpar busca"
                  variant="secondary"
                  onPress={() => setBusca('')}
                  testID="inbox-clear-search"
                />
              ) : null}
            </View>
          ) : null
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={refreshing && !loading}
        onRefresh={refresh}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && !loading}
            onRefresh={refresh}
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
                {previaMensagem(item, autor)}
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
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: { gap: spacing.md, padding: spacing.xl },
  heading: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  headingText: { flex: 1 },
  titleIcon: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.md },
  title: { color: colors.text, fontSize: fontSizes.xxl, fontFamily: fonts.extrabold },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    marginTop: spacing.xs,
  },
  count: { color: colors.textSecondary, fontSize: fontSizes.sm, fontFamily: fonts.medium },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
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
