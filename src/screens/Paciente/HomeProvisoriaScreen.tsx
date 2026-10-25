import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../components/Avatar/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import { useMenuPaciente } from './useMenuPaciente';

/**
 * Home provisória do paciente: só a saudação e o avatar que abre o menu (#46), como no topo da
 * "17 Home Paciente" do Figma. A Home completa é a atividade #38.
 */
export function HomeProvisoriaScreen() {
  const { user } = useAuth();
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
  aviso: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textSecondary },
});
