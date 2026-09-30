import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
};

/** Campo com rótulo e mensagem de erro (origem: classes `.field` do SCSS do login). */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focado, setFocado] = useState(false);
  // Multilinha (`<textarea rows>` do Angular): altura mínima pelo número de linhas.
  const linhas = inputProps.multiline ? (inputProps.numberOfLines ?? 3) : 0;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          linhas > 0 && [styles.multilinha, { minHeight: linhas * LINHA + 2 * spacing.md }],
          focado && styles.inputFocado,
          !!error && styles.inputInvalido,
        ]}
        onFocus={(e) => {
          setFocado(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          onBlur?.(e);
        }}
        {...inputProps}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const LINHA = 22;

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  multilinha: { textAlignVertical: 'top', lineHeight: LINHA },
  inputFocado: { borderColor: colors.primary },
  inputInvalido: { borderColor: colors.danger },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.danger,
  },
});
