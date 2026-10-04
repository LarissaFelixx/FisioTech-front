import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../components/Avatar/Avatar';
import { Button } from '../../components/Button/Button';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { Icon, type IconName } from '../../components/Icon/Icon';
import { ProfileMenu } from '../../components/ProfileMenu/ProfileMenu';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { useConsultas } from '../../hooks/useConsultas';
import { usePacientes } from '../../hooks/usePacientes';
import { useAuth } from '../../hooks/useAuth';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import type { ProfissionalStackParamList, ProfissionalTabsParamList } from '../../navigation/types';
import {
  colors,
  fontSizes,
  fonts,
  radius,
  shadows,
  spacing,
  tints,
  type AvatarTint,
} from '../../theme';
import type { Consulta } from '../../types/consulta';
import { clock } from '../../utils/clock';
import { formatHora, parseDataHora } from '../../utils/date';
import {
  agendaHoje,
  consultasHoje,
  countdown,
  proximaConsulta,
  subtitulo,
  tipoLabel,
} from './homeLogic';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<ProfissionalTabsParamList, 'Home'>,
  NativeStackNavigationProp<ProfissionalStackParamList>
>;

/** Origem: `features/home` (home do profissional). */
export function ProfissionalHomeScreen() {
  const navigation = useNavigation<Navigation>();
  const { user, logout } = useAuth();
  const consultasQuery = useConsultas();
  const pacientesQuery = usePacientes();
  const [menuAberto, setMenuAberto] = useState(false);

  const { refetch: refetchConsultas } = consultasQuery;
  const { refetch: refetchPacientes } = pacientesQuery;
  const refetchTudo = useCallback(() => {
    void refetchConsultas();
    void refetchPacientes();
  }, [refetchConsultas, refetchPacientes]);
  useRefetchOnFocus(refetchTudo);

  const nome = user?.nome ?? '';
  const agora = clock.agora();
  const consultas = consultasQuery.data ?? [];
  const proxima = consultasQuery.data ? proximaConsulta(consultas, agora) : null;
  const hoje = consultasHoje(consultas, agora);
  const agenda = agendaHoje(consultas, agora);

  const carregandoConsultas = consultasQuery.isPending;
  const erroConsultas = consultasQuery.isError && !consultasQuery.data;
  const erro = erroConsultas || (pacientesQuery.isError && !pacientesQuery.data);
  const atualizando =
    (consultasQuery.isRefetching || pacientesQuery.isRefetching) && !carregandoConsultas;

  const abrirConsulta = (consulta: Consulta) =>
    navigation.navigate('ConsultaDetalhe', { id: consulta.id });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={refetchTudo}
            colors={[colors.primary]}
          />
        }
        testID="home-scroll"
      >
        {/* A saudação inteira (nome + avatar) abre o menu do perfil: alvo de toque maior. */}
        <Pressable
          style={styles.greeting}
          onPress={() => setMenuAberto(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu do perfil"
          accessibilityHint="Alterar senha ou sair"
          testID="home-perfil"
        >
          <View style={styles.greetingText}>
            <Text style={styles.greetingLabel}>Bem-vindo(a),</Text>
            <Text style={styles.greetingName} testID="home-nome">
              {nome}
            </Text>
          </View>
          <Avatar nome={nome} size={48} shape="circle" />
        </Pressable>

        {erro ? (
          <ErrorState
            message="Não foi possível carregar seus dados."
            onRetry={refetchTudo}
            retrying={consultasQuery.isFetching || pacientesQuery.isFetching}
          />
        ) : null}

        {carregandoConsultas ? (
          <View style={styles.card}>
            <Skeleton variant="lines" count={4} />
          </View>
        ) : erroConsultas ? null : proxima ? (
          <View style={styles.card} testID="home-hero">
            <View style={styles.heroTop}>
              <Text style={styles.eyebrow}>Próxima consulta</Text>
              <Text style={styles.badge}>{countdown(proxima, agora)}</Text>
            </View>
            <Text style={styles.heroTime}>{formatHora(parseDataHora(proxima.dataHora))}</Text>
            <Text style={styles.heroNome}>{proxima.pacienteNome}</Text>
            <Text style={styles.heroSub}>{subtitulo(proxima)}</Text>
            <View style={styles.heroActions}>
              <View style={styles.flex}>
                <Button
                  label="Iniciar consulta"
                  onPress={() => navigation.navigate('ConsultaWizard', { id: proxima.id })}
                  testID="home-iniciar-consulta"
                />
              </View>
              <View style={styles.flex}>
                <Button
                  label="Prontuário"
                  variant="secondary"
                  onPress={() => abrirConsulta(proxima)}
                  testID="home-prontuario"
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.card} testID="home-hero-vazio">
            <Text style={styles.eyebrow}>Próxima consulta</Text>
            <Text style={styles.heroVazio}>Nenhuma consulta futura agendada.</Text>
          </View>
        )}

        <View style={styles.stats}>
          <StatCard
            icon="users"
            tint="blue"
            valor={pacientesQuery.data ? String(pacientesQuery.data.length) : '–'}
            label="pacientes ativos"
            testID="stat-pacientes"
          />
          <StatCard
            icon="calendar"
            tint="green"
            valor={consultasQuery.data ? String(hoje.length) : '–'}
            label="sessões hoje"
            testID="stat-sessoes"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agenda de hoje</Text>
          <Pressable
            onPress={() => navigation.navigate('Consultas')}
            accessibilityRole="link"
            hitSlop={8}
          >
            <Text style={styles.sectionLink}>ver tudo</Text>
          </Pressable>
        </View>

        {carregandoConsultas ? (
          <Skeleton variant="list" count={3} />
        ) : erroConsultas ? null : agenda.length === 0 ? (
          <Text style={styles.state}>Nenhuma outra consulta hoje.</Text>
        ) : (
          <View style={styles.agenda} testID="home-agenda">
            {agenda.map((c, index) => (
              <Pressable
                key={c.id}
                onPress={() => abrirConsulta(c)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.agendaRow,
                  index < agenda.length - 1 && styles.agendaDivider,
                  pressed && styles.pressed,
                ]}
              >
                <Avatar nome={c.pacienteNome} />
                <View style={styles.agendaInfo}>
                  <Text style={styles.agendaNome} numberOfLines={1}>
                    {c.pacienteNome}
                  </Text>
                  <Text style={styles.agendaSub}>
                    {formatHora(parseDataHora(c.dataHora))} · {tipoLabel(c)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <ProfileMenu
        visible={menuAberto}
        nome={nome}
        onClose={() => setMenuAberto(false)}
        items={[
          {
            label: 'Alterar Senha',
            icon: 'lock',
            onPress: () => navigation.navigate('AlterarSenha'),
          },
        ]}
        onLogout={() => void logout()}
      />
    </SafeAreaView>
  );
}

function StatCard(props: {
  icon: IconName;
  tint: AvatarTint;
  valor: string;
  label: string;
  testID: string;
}) {
  const tint = tints[props.tint];
  return (
    <View style={[styles.card, styles.statCard]} testID={props.testID}>
      <View style={[styles.iconTile, { backgroundColor: tint.bg }]}>
        <Icon name={props.icon} size={20} color={tint.fg} />
      </View>
      <Text style={styles.statValue}>{props.valor}</Text>
      <Text style={styles.statLabel}>{props.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.lg },
  flex: { flex: 1 },
  greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingText: { flex: 1, paddingRight: spacing.md },
  greetingLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  greetingName: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    ...shadows.card,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
  badge: {
    backgroundColor: tints.orange.bg,
    color: tints.orange.fg,
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  heroTime: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.display,
    letterSpacing: -0.5,
    color: colors.text,
    marginTop: spacing.sm,
  },
  heroNome: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.base,
    color: colors.text,
    marginTop: spacing.xs,
  },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  heroVazio: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  stats: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, padding: spacing.lg, gap: 10 },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontFamily: fonts.extrabold, fontSize: fontSizes.xxl, color: colors.text },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: -6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.text },
  sectionLink: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.primary },
  state: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  agenda: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  agendaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 14 },
  agendaDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  agendaInfo: { flex: 1, minWidth: 0 },
  agendaNome: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
  agendaSub: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  pressed: { opacity: 0.7 },
});
