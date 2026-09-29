import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';

/**
 * Havia uma sessão salva, mas não foi possível validá-la (sem conexão ou erro no servidor).
 * O usuário continua logado: pode tentar de novo ou sair por conta própria.
 */
export function RestoreErrorScreen() {
  const { restore, logout } = useAuth();
  const [saindo, setSaindo] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card} testID="restore-error">
        <Text style={styles.title} accessibilityRole="header">
          Não foi possível conectar
        </Text>
        <Text style={styles.message}>
          Verifique sua conexão com a internet e se o servidor está disponível. Sua sessão foi
          mantida.
        </Text>
        <Button label="Tentar novamente" onPress={() => void restore()} testID="restore-retry" />
        <Button
          label="Sair"
          variant="secondary"
          loading={saindo}
          onPress={() => {
            setSaindo(true);
            void logout();
          }}
          testID="restore-sair"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xxl,
    gap: spacing.md,
    ...shadows.card,
  },
  title: { fontFamily: fonts.extrabold, fontSize: fontSizes.xl, color: colors.text },
  message: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
