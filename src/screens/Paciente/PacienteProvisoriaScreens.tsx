import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';

/**
 * Destinos da Home do paciente (#38) que são outras atividades do backlog. Ficam provisórios
 * até essas telas chegarem.
 */
function Provisoria({
  titulo,
  aviso,
  abaixoDoHeader = false,
}: {
  titulo?: string;
  aviso: string;
  /** Telas empilhadas já têm o cabeçalho nativo com o título. */
  abaixoDoHeader?: boolean;
}) {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={abaixoDoHeader ? ['left', 'right'] : ['top', 'left', 'right']}
    >
      <View style={styles.content}>
        {titulo ? (
          <Text style={styles.titulo} accessibilityRole="header">
            {titulo}
          </Text>
        ) : null}
        <View style={styles.card}>
          <Text style={styles.aviso}>{aviso}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function PerfilProvisoriaScreen() {
  return <Provisoria titulo="Meu Perfil" aviso="O seu perfil chega com a atividade #44." />;
}

export function ConsultaDetalheProvisoriaScreen() {
  return <Provisoria abaixoDoHeader aviso="O detalhe da consulta chega com a atividade #41." />;
}

export function MeuTratamentoProvisoriaScreen() {
  return <Provisoria abaixoDoHeader aviso="O seu tratamento chega com a atividade #47." />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.lg },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    ...shadows.card,
  },
  aviso: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textSecondary },
});
