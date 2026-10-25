import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';
import type { Opcao } from '../OptionChips/OptionChips';

type Props = {
  label: string;
  opcoes: Opcao[];
  selecionados: string[];
  onToggle: (valor: string) => void;
  testID?: string;
};

/** Múltipla escolha em chips: cada chip liga e desliga (origem: `.chip` / `.chip--ativo`). */
export function ToggleChips({ label, opcoes, selecionados, onToggle, testID }: Props) {
  return (
    <View style={styles.field} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips} accessibilityLabel={label}>
        {opcoes.map((opcao) => {
          const ativo = selecionados.includes(opcao.valor);
          return (
            <Pressable
              key={opcao.valor}
              accessibilityRole="checkbox"
              accessibilityLabel={opcao.label}
              accessibilityState={{ checked: ativo }}
              onPress={() => onToggle(opcao.valor)}
              style={[styles.chip, ativo && styles.chipAtivo]}
            >
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{opcao.label}</Text>
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
