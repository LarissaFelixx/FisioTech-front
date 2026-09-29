import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Icon } from '../../components/Icon/Icon';
import { colors, gradients, spacing } from '../../theme';

/** Exibida enquanto a sessão salva é restaurada ao abrir o app. */
export function SplashScreen() {
  return (
    <View
      style={styles.container}
      accessibilityLabel="Restaurando sessão"
      testID="splash-restaurando"
    >
      <LinearGradient
        colors={gradients.hero.colors}
        start={gradients.hero.start}
        end={gradients.hero.end}
        style={styles.logo}
      >
        <Icon name="heart" size={32} color={colors.textInverse} />
      </LinearGradient>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    backgroundColor: colors.bg,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
