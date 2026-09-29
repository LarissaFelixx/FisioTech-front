import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fonts, radius } from '../../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

/** Botão em pílula (origem: `.login__submit`, `.hero__primary` e `.hero__secondary`). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}: Props) {
  const inativo = disabled || loading;
  const primario = variant === 'primary';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inativo, busy: loading }}
      disabled={inativo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primario ? styles.primary : styles.secondary,
        inativo && styles.disabled,
        pressed && !inativo && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={primario ? colors.textInverse : colors.text} />
        ) : null}
        <Text style={[styles.label, primario ? styles.labelPrimary : styles.labelSecondary]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.bg },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.9 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.bold, fontSize: fontSizes.md },
  labelPrimary: { color: colors.textInverse },
  labelSecondary: { color: colors.text },
});
