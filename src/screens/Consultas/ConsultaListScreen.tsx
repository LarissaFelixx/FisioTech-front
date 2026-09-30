import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '../../components/ErrorState/ErrorState';
import { Icon } from '../../components/Icon/Icon';
import { OptionChips } from '../../components/OptionChips/OptionChips';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { StatusBadge, corDoStatus } from '../../components/StatusBadge/StatusBadge';
import { useConsultas } from '../../hooks/useConsultas';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import type { ProfissionalStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import type { Consulta } from '../../types/consulta';
import { formatHora, parseDataHora } from '../../utils/date';
import { FILTROS, agruparPorDia, filtrarConsultas, tipoLabel, type Filtro } from './consultaLogic';

type Navigation = NativeStackNavigationProp<ProfissionalStackParamList>;

/** Origem: `features/consultas/consulta-list` (aba Consultas do profissional). */
export function ConsultaListScreen() {
  const navigation = useNavigation<Navigation>();
  const { data, isPending, isError, isRefetching, refetch } = useConsultas();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  useRefetchOnFocus(refetch);

  const consultas = useMemo(() => data ?? [], [data]);
  const filtradas = useMemo(() => filtrarConsultas(consultas, filtro), [consultas, filtro]);
  const grupos = useMemo(
    () => agruparPorDia(filtradas).map((g) => ({ ...g, data: g.consultas, dia: g.data })),
    [filtradas],
  );

  const temConsultas = !isPending && !isError && consultas.length > 0;

  const cabecalho = (
    <View style={styles.cabecalho}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Consultas
        </Text>
        <Pressable
          onPress={() => navigation.navigate('ConsultaNova', {})}
          accessibilityRole="button"
          accessibilityLabel="Nova consulta"
          style={({ pressed }) => [styles.novo, pressed && styles.pressed]}
          testID="consulta-nova"
        >
          <Icon name="plus" size={22} color={colors.textInverse} />
        </Pressable>
      </View>
      {temConsultas ? (
        <OptionChips
          accessibilityLabel="Filtro de consultas"
          opcoes={FILTROS}
          valor={filtro}
          onChange={(v) => setFiltro(v as Filtro)}
          testID="consulta-filtros"
        />
      ) : null}
    </View>
  );

  const vazio = isPending ? (
    <Skeleton variant="list" count={4} />
  ) : isError ? (
    <ErrorState
      message="Não foi possível carregar as consultas."
      onRetry={() => void refetch()}
      retrying={isRefetching}
    />
  ) : (
    <Text style={styles.state}>
      {consultas.length === 0
        ? 'Nenhuma consulta ainda. Abra um paciente em "Pacientes" para iniciar uma.'
        : 'Nenhuma consulta neste filtro.'}
    </Text>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SectionList
        sections={isPending || isError ? [] : grupos}
        keyExtractor={(c) => String(c.id)}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={vazio}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isPending}
            onRefresh={() => void refetch()}
            colors={[colors.primary]}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.grupo} accessibilityRole="header">
            {section.label}
          </Text>
        )}
        renderItem={({ item }) => (
          <CartaoConsulta
            consulta={item}
            onPress={() => navigation.navigate('ConsultaDetalhe', { id: item.id })}
          />
        )}
      />
    </SafeAreaView>
  );
}

function CartaoConsulta({ consulta, onPress }: { consulta: Consulta; onPress: () => void }) {
  const cancelada = consulta.status === 'CANCELADA';
  const detalhes = [
    formatHora(parseDataHora(consulta.dataHora)),
    tipoLabel(consulta.tipo),
    consulta.convenio,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: corDoStatus(consulta.status).fg },
        pressed && styles.pressed,
      ]}
      testID={`consulta-${consulta.id}`}
    >
      <View style={styles.info}>
        <Text style={[styles.paciente, cancelada && styles.pacienteCancelada]} numberOfLines={1}>
          {consulta.pacienteNome}
        </Text>
        <Text style={styles.detalhes}>{detalhes}</Text>
      </View>
      <StatusBadge status={consulta.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  cabecalho: { gap: spacing.lg, marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  novo: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  state: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  grupo: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    color: colors.textTertiary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 14,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    ...shadows.card,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  paciente: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
  pacienteCancelada: { textDecorationLine: 'line-through', color: colors.textSecondary },
  detalhes: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  pressed: { opacity: 0.7 },
});
