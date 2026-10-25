import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../components/Avatar/Avatar';
import { Icon } from '../../components/Icon/Icon';
import { useAuth } from '../../hooks/useAuth';
import type { PacienteStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing, statusColors } from '../../theme';
import { useMenuPaciente } from './useMenuPaciente';

/**
 * Home provisória do paciente: a saudação, o avatar que abre o menu (#46) e o atalho "Meu
 * tratamento" (#47), como na "17 Home Paciente" do Figma. A Home completa é a atividade #38.
 */
export function HomeProvisoriaScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<PacienteStackParamList>>();
  const { menu, abrirMenu } = useMenuPaciente();
  const nome = user?.nome ?? '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.saudacao}>
            <Text style={styles.bemVindo}>Bem-vindo,</Text>
            <Text style={styles.nome} accessibilityRole="header" numberOfLines={1}>
              {nome}
            </Text>
          </View>
          <Pressable
            onPress={abrirMenu}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            hitSlop={8}
            testID="paciente-avatar"
          >
            <Avatar nome={nome} size={40} shape="circle" />
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate('MeuTratamento')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.card, styles.atalho, pressed && styles.pressed]}
          testID="home-meu-tratamento"
        >
          <View style={styles.atalhoIcone}>
            <Icon name="clipboard" size={20} color={colors.primary} />
          </View>
          <View style={styles.atalhoTexto}>
            <Text style={styles.atalhoTitulo}>Meu tratamento</Text>
            <Text style={styles.atalhoDica}>Plano e evoluções</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.textTertiary} />
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.aviso}>A tela inicial completa chega com a atividade #38.</Text>
        </View>
      </ScrollView>
      {menu}
    </SafeAreaView>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.card,
  },
  atalho: { flexDirection: 'row', alignItems: 'center' },
  atalhoIcone: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    backgroundColor: statusColors.confirmada.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoTexto: { flex: 1, gap: 2 },
  atalhoTitulo: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
  atalhoDica: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textTertiary },
  pressed: { opacity: 0.7 },
  aviso: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textSecondary },
});
