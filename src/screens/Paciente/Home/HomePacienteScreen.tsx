import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../../components/Avatar/Avatar';
import { Icon, type IconName } from '../../../components/Icon/Icon';
import { MenuLateral } from '../../../components/MenuLateral/MenuLateral';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { useAuth } from '../../../hooks/useAuth';
import { useMinhasConsultas, useMinhasConversas } from '../../../hooks/useMe';
import { useRefetchOnFocus } from '../../../hooks/useRefetchOnFocus';
import type { PacienteStackParamList } from '../../../navigation/types';
import {
  colors,
  fontSizes,
  fonts,
  gradients,
  radius,
  shadows,
  spacing,
  tints,
} from '../../../theme';
import { clock } from '../../../utils/clock';
import {
  destaqueConsulta,
  proximaConsulta,
  resumoConsultas,
  temMensagemNova,
} from './homePacienteLogic';

type Atalho = {
  titulo: string;
  dica: string;
  icon: IconName;
  tint: { bg: string; fg: string };
  onPress: () => void;
  testID: string;
  novidade?: boolean;
};

/**
 * Home do paciente (#38, Figma "17 Home Paciente"): saudação, destaque da próxima consulta e
 * atalhos para consultas, tratamento, mensagens e perfil. O avatar abre o menu com "Sair".
 */
export function HomePacienteScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<PacienteStackParamList>>();
  const consultas = useMinhasConsultas();
  const conversas = useMinhasConversas();
  const [menuAberto, setMenuAberto] = useState(false);
  const nome = user?.nome ?? '';

  const { refetch: refetchConsultas } = consultas;
  const { refetch: refetchConversas } = conversas;
  const recarregar = useCallback(() => {
    void refetchConsultas();
    void refetchConversas();
  }, [refetchConsultas, refetchConversas]);
  useRefetchOnFocus(recarregar);

  const proxima = consultas.data ? proximaConsulta(consultas.data, clock.agora()) : null;
  const semConsultas = consultas.data?.length === 0;

  const atalhos: Atalho[] = [
    {
      titulo: 'Minhas consultas',
      // Sem os dados (carregando ou erro) o atalho continua funcionando, como no Angular.
      dica: consultas.data ? resumoConsultas(consultas.data) : 'Ver consultas',
      icon: 'credit-card',
      tint: tints.green,
      onPress: () => navigation.navigate('Tabs', { screen: 'Consultas' }),
      testID: 'home-minhas-consultas',
    },
    {
      titulo: 'Meu tratamento',
      dica: 'Plano e evoluções',
      icon: 'clipboard',
      tint: tints.blue,
      onPress: () => navigation.navigate('MeuTratamento'),
      testID: 'home-meu-tratamento',
    },
    {
      titulo: 'Mensagens',
      dica: 'Ver conversas',
      icon: 'chat',
      tint: tints.orange,
      onPress: () => navigation.navigate('Tabs', { screen: 'Mensagens' }),
      testID: 'home-mensagens',
      novidade: conversas.data ? temMensagemNova(conversas.data) : false,
    },
    {
      titulo: 'Meu perfil',
      dica: 'Editar meus dados',
      icon: 'user',
      tint: tints.purple,
      onPress: () => navigation.navigate('Tabs', { screen: 'Perfil' }),
      testID: 'home-meu-perfil',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={consultas.isRefetching}
            onRefresh={recarregar}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.saudacao}>
            <Text style={styles.bemVindo}>Bem-vindo,</Text>
            <Text style={styles.nome} accessibilityRole="header" numberOfLines={1}>
              {nome}
            </Text>
          </View>
          <Pressable
            onPress={() => setMenuAberto(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            hitSlop={8}
            testID="paciente-avatar"
          >
            <Avatar nome={nome} size={40} shape="circle" />
          </Pressable>
        </View>

        {consultas.isPending ? (
          <Skeleton variant="lines" count={3} />
        ) : proxima ? (
          <Destaque
            consultaId={proxima.id}
            {...destaqueConsulta(proxima)}
            onAbrir={(id) => navigation.navigate('ConsultaDetalhe', { id })}
          />
        ) : null}

        {semConsultas ? (
          <Pressable
            onPress={() => navigation.navigate('Tabs', { screen: 'Consultas' })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primeira, pressed && styles.pressed]}
            testID="home-marcar-primeira"
          >
            <Text style={styles.primeiraTexto}>Marcar sua primeira consulta</Text>
            <Icon name="calendar-plus" size={22} color={colors.textInverse} />
          </Pressable>
        ) : null}

        <View style={styles.lista}>
          {atalhos.map((a, i) => (
            <Pressable
              key={a.testID}
              onPress={a.onPress}
              accessibilityRole="button"
              accessibilityLabel={a.novidade ? `${a.titulo}, novas mensagens` : a.titulo}
              style={({ pressed }) => [
                styles.atalho,
                i < atalhos.length - 1 && styles.divisor,
                pressed && styles.pressed,
              ]}
              testID={a.testID}
            >
              <View style={[styles.tile, { backgroundColor: a.tint.bg }]}>
                <Icon name={a.icon} size={20} color={a.tint.fg} />
              </View>
              <View style={styles.atalhoTexto}>
                <Text style={styles.atalhoTitulo}>{a.titulo}</Text>
                <Text style={styles.atalhoDica}>{a.dica}</Text>
              </View>
              {a.novidade ? (
                <View style={styles.ponto} testID="home-mensagens-novas" />
              ) : (
                <Icon name="chevron-right" size={18} color={colors.textTertiary} />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <MenuLateral
        visible={menuAberto}
        nome={nome}
        papel="Paciente"
        items={[]}
        onClose={() => setMenuAberto(false)}
        onLogout={() => void logout()}
      />
    </SafeAreaView>
  );
}

type DestaqueProps = ReturnType<typeof destaqueConsulta> & {
  consultaId: number;
  onAbrir: (id: number) => void;
};

/** Cartão "Sua próxima consulta"; "Ver detalhes" e "Remarcar" abrem o detalhe, como no Angular. */
function Destaque({ consultaId, dia, mesHora, detalhe, onAbrir }: DestaqueProps) {
  return (
    <LinearGradient
      colors={gradients.hero.colors}
      start={gradients.hero.start}
      end={gradients.hero.end}
      style={styles.destaque}
      testID="home-proxima-consulta"
    >
      <Text style={styles.eyebrow}>Sua próxima consulta</Text>
      <View style={styles.quando}>
        <Text style={styles.dia}>{dia}</Text>
        <Text style={styles.mesHora}>{mesHora}</Text>
      </View>
      <Text style={styles.detalhe}>{detalhe}</Text>
      <View style={styles.acoes}>
        <Pressable
          onPress={() => onAbrir(consultaId)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.verDetalhes, pressed && styles.pressed]}
          testID="home-ver-detalhes"
        >
          <Text style={styles.verDetalhesTexto}>Ver detalhes</Text>
        </Pressable>
        <Pressable
          onPress={() => onAbrir(consultaId)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.remarcar, pressed && styles.pressed]}
          testID="home-remarcar"
        >
          <Text style={styles.remarcarTexto}>Remarcar</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  saudacao: { flex: 1, minWidth: 0 },
  bemVindo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  nome: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  destaque: { borderRadius: radius.md, padding: spacing.xl, ...shadows.card },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textInverse,
    opacity: 0.85,
  },
  quando: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.sm },
  dia: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.display,
    letterSpacing: -0.5,
    color: colors.textInverse,
  },
  mesHora: { fontFamily: fonts.semibold, fontSize: fontSizes.lg, color: colors.textInverse },
  detalhe: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textInverse,
    opacity: 0.9,
    marginTop: 2,
  },
  acoes: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  verDetalhes: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  verDetalhesTexto: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.primaryDark },
  remarcar: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  remarcarTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.textInverse },
  primeira: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    ...shadows.card,
  },
  primeiraTexto: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.textInverse },
  lista: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  atalho: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  divisor: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoTexto: { flex: 1, minWidth: 0, gap: 2 },
  atalhoTitulo: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
  atalhoDica: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textTertiary },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: tints.orange.fg },
  pressed: { opacity: 0.7 },
});
