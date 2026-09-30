import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSizes, fonts, gradients, radius, shadows, spacing } from '../../theme';

type Props = {
  title: string;
  message: string;
};

/** Tela provisória usada enquanto as telas reais não são migradas. */
export function PlaceholderScreen({ title, message }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <LinearGradient
          colors={gradients.hero.colors}
          start={gradients.hero.start}
          end={gradients.hero.end}
          style={styles.logo}
        >
          <Text style={styles.logoText}>F</Text>
        </LinearGradient>
        <Text style={styles.brand}>FisioTech</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xxl,
    ...shadows.card,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoText: {
    color: colors.textInverse,
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
  },
  brand: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    textAlign: 'center',
  },
});
