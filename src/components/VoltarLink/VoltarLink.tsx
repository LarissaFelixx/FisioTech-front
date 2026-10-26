import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSizes, fonts, spacing } from '../../theme';
import { Icon } from '../Icon/Icon';

type Props = {
  /** Para onde volta (ex.: "Home", "Minhas Consultas"), como no Figma. */
  label: string;
  onPress: () => void;
  testID?: string;
};

/** Link "‹ Destino" no topo das telas do paciente (substitui o header nativo, como no Figma). */
export function VoltarLink({ label, onPress, testID = 'voltar' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Voltar para ${label}`}
      hitSlop={8}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      testID={testID}
    >
      <Icon name="chevron-left" size={16} color={colors.primary} />
      <Text style={styles.texto}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  texto: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.primary },
  pressed: { opacity: 0.7 },
});
