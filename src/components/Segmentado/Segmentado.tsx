import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import type { Opcao } from '../OptionChips/OptionChips';

type Props = {
  /** Nome do grupo para leitores de tela (o rótulo visível fica fora, como no Figma). */
  accessibilityLabel: string;
  opcoes: Opcao[];
  valor: string;
  onChange: (valor: string) => void;
  testID?: string;
};

/**
 * Controle segmentado (Figma "19 Marcar Consulta": "Particular | Convênio" e
 * "Presencial | Online"): trilho cinza com a opção ativa em branco.
 */
export function Segmentado({ accessibilityLabel, opcoes, valor, onChange, testID }: Props) {
  return (
    <View
      style={styles.trilho}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {opcoes.map((opcao) => {
        const ativa = opcao.valor === valor;
        return (
          <Pressable
            key={opcao.valor}
            onPress={() => onChange(opcao.valor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: ativa }}
            accessibilityLabel={opcao.label}
            style={[styles.opcao, ativa && styles.ativa]}
            testID={testID ? `${testID}-${opcao.valor}` : undefined}
          >
            <Text style={[styles.texto, ativa && styles.textoAtivo]}>{opcao.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  trilho: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  opcao: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm - spacing.xs,
  },
  ativa: { backgroundColor: colors.surface, ...shadows.card },
  texto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.textTertiary },
  textoAtivo: { color: colors.primary },
});
