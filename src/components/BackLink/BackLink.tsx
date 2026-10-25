import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSizes, fonts, spacing } from '../../theme';
import { Icon } from '../Icon/Icon';

type Props = {
  label: string;
  onPress: () => void;
  testID?: string;
};

/** Link "‹ Tela anterior" no topo das telas sem o cabeçalho padrão. */
export function BackLink({ label, onPress, testID }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      hitSlop={8}
      style={({ pressed }) => [styles.voltar, pressed && styles.pressed]}
      testID={testID}
    >
      <Icon name="chevron-left" size={18} color={colors.primary} />
      <Text style={styles.texto}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  texto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.primary },
  pressed: { opacity: 0.7 },
});
