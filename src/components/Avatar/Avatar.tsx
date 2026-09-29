import { StyleSheet, Text, View } from 'react-native';

import { fonts, radius, tints } from '../../theme';
import { avatarTint } from '../../utils/avatarTint';
import { iniciais } from '../../utils/iniciais';

type Props = {
  nome: string;
  size?: number;
  /** `circle` (saudação da home) ou `rounded` (linhas de lista, como `.agenda-row__avatar`). */
  shape?: 'circle' | 'rounded';
  testID?: string;
};

/** Avatar com as iniciais do nome, colorido por um hash estável do próprio nome. */
export function Avatar({ nome, size = 40, shape = 'rounded', testID }: Props) {
  const tint = tints[avatarTint(nome)];
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: shape === 'circle' ? size / 2 : radius.tile,
          backgroundColor: tint.bg,
        },
      ]}
    >
      <Text style={[styles.text, { color: tint.fg, fontSize: Math.round(size * 0.33) }]}>
        {iniciais(nome)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    fontFamily: fonts.bold,
  },
});
