import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';

type Props = {
  label: string;
  value: boolean;
  onValueChange: (valor: boolean) => void;
  testID?: string;
};

/** Card com rótulo e switch (ex.: "Visível para o paciente"). */
export function SwitchCard({ label, value, onValueChange, testID }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.texto}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.border}
        accessibilityLabel={label}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
  },
  texto: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
});
