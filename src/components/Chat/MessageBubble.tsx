import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';
import type { Mensagem } from '../../types/mensagem';
import { formatHora, parseDataHora } from '../../utils/date';

export function MessageBubble({ mensagem, propria }: { mensagem: Mensagem; propria: boolean }) {
  const hora = formatHora(parseDataHora(mensagem.dataEnvio));
  return (
    <View style={[styles.row, propria && styles.ownRow]}>
      <View
        style={[styles.bubble, propria && styles.ownBubble]}
        testID={`mensagem-${mensagem.id}`}
        accessible
        accessibilityLabel={`${propria ? 'Você' : 'Recebida'}, ${hora}: ${mensagem.conteudo}`}
      >
        <Text selectable style={[styles.content, propria && styles.inverse]}>
          {mensagem.conteudo}
        </Text>
        <Text style={[styles.time, propria && styles.inverse]}>{hora}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start', marginVertical: spacing.xs },
  ownRow: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  ownBubble: { backgroundColor: colors.primaryDark },
  content: { color: colors.text, fontFamily: fonts.regular, fontSize: fontSizes.base },
  time: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  inverse: { color: colors.textInverse },
});
