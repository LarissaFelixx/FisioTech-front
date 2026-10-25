import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '../Placeholder/PlaceholderScreen';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import { AdminCabecalho } from './AdminCabecalho';
import { useMenuAdmin } from './useMenuAdmin';

/**
 * Abas provisórias do admin: o cabeçalho com o menu (#37) já funciona; as listas de verdade são
 * as atividades #31 (Profissionais) e #34 (Pacientes).
 */
function AbaProvisoria({ titulo, aviso }: { titulo: string; aviso: string }) {
  const { menu, abrirMenu } = useMenuAdmin();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdminCabecalho titulo={titulo} onAbrirMenu={abrirMenu} />
        <View style={styles.card}>
          <Text style={styles.aviso}>{aviso}</Text>
        </View>
      </ScrollView>
      {menu}
    </SafeAreaView>
  );
}

export function ProfissionaisProvisoriaScreen() {
  return (
    <AbaProvisoria
      titulo="Profissionais"
      aviso="A lista de profissionais chega com a atividade #31."
    />
  );
}

export function PacientesProvisoriaScreen() {
  return (
    <AbaProvisoria titulo="Pacientes" aviso="A lista de pacientes chega com a atividade #34." />
  );
}

/** Destino de "Alterar Senha" no menu; a tela de verdade é a atividade #36. */
export function AlterarSenhaAdminProvisoriaScreen() {
  return (
    <PlaceholderScreen
      title="Alterar senha"
      message="A troca de senha do administrador chega com a atividade #36."
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    ...shadows.card,
  },
  aviso: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textSecondary },
});
