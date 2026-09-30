import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';

export type Opcao = { valor: string; label: string };

type Props = {
  /** Rótulo visível acima dos chips; sem ele, `accessibilityLabel` nomeia o grupo. */
  label?: string;
  accessibilityLabel?: string;
  opcoes: Opcao[];
  valor: string;
  onChange: (valor: string) => void;
  testID?: string;
};

/** Escolha única em chips (substitui o `<select>` dos formulários do Angular). */
export function OptionChips({ label, accessibilityLabel, opcoes, valor, onChange, testID }: Props) {
  return (
    <View style={styles.field} testID={testID}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={styles.chips}
        accessibilityRole="radiogroup"
        accessibilityLabel={label ?? accessibilityLabel}
      >
        {opcoes.map((opcao) => {
          const ativa = opcao.valor === valor;
          return (
            <Pressable
              key={opcao.valor}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativa }}
              onPress={() => onChange(opcao.valor)}
              style={[styles.chip, ativa && styles.chipAtivo]}
            >
              <Text style={[styles.chipTexto, ativa && styles.chipTextoAtivo]}>{opcao.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.text },
  chipTextoAtivo: { color: colors.textInverse },
});
