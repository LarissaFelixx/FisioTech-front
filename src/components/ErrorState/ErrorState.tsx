import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import { Button } from '../Button/Button';

type Props = {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
};

/** Cartão de erro com "Tentar novamente" (não existia no Angular, que engolia os erros). */
export function ErrorState({ message, onRetry, retrying = false }: Props) {
  return (
    <View style={styles.card} accessibilityRole="alert" testID="error-state">
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button label="Tentar novamente" variant="secondary" onPress={onRetry} loading={retrying} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.card,
  },
  message: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
    color: colors.danger,
    textAlign: 'center',
  },
});
