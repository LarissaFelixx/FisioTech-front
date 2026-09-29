import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type DimensionValue } from 'react-native';

import { colors, radius } from '../../theme';

export type SkeletonVariant = 'list' | 'form' | 'thread' | 'lines';

type Props = {
  variant?: SkeletonVariant;
  count?: number;
};

/**
 * Placeholder animado no lugar de "Carregando..." (origem: `core/ui/skeleton`). O formato aproxima
 * a silhueta do conteúdo real. A animação é desligada quando o sistema pede redução de movimento.
 */
export function Skeleton({ variant = 'lines', count = 3 }: Props) {
  const opacity = usePulse();
  const items = Array.from({ length: count }, (_, i) => i);

  const bar = (width: DimensionValue, height = 14, key?: number) => (
    <Animated.View key={key} style={[styles.bone, { width, height, opacity }]} />
  );

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
      testID={`skeleton-${variant}`}
    >
      {variant === 'list' &&
        items.map((i) => (
          <View key={i} style={styles.row} testID="skeleton-item">
            <Animated.View style={[styles.bone, styles.avatar, { opacity }]} />
            <View style={styles.rowLines}>
              {bar('40%')}
              {bar('70%')}
            </View>
          </View>
        ))}

      {variant === 'form' &&
        items.map((i) => (
          <View key={i} style={styles.field} testID="skeleton-item">
            {bar('30%', 10)}
            {bar('100%', 40)}
          </View>
        ))}

      {variant === 'thread' &&
        items.map((i) => (
          <View
            key={i}
            style={[styles.bubbleRow, i % 2 === 1 && styles.bubbleRowRight]}
            testID="skeleton-item"
          >
            <Animated.View style={[styles.bone, styles.bubble, { opacity }]} />
          </View>
        ))}

      {variant === 'lines' &&
        items.map((i) => (
          <View key={i} testID="skeleton-item">
            {bar(i === items.length - 1 ? '60%' : '100%')}
          </View>
        ))}
    </View>
  );
}

function usePulse(): Animated.Value {
  const [opacity] = useState(() => new Animated.Value(1));
  const [reduzirMovimento, setReduzirMovimento] = useState(false);

  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((valor) => ativo && setReduzirMovimento(valor))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (reduzirMovimento) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduzirMovimento]);

  return opacity;
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  bone: { backgroundColor: colors.border, borderRadius: radius.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLines: { flex: 1, gap: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  field: { gap: 6 },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubble: { width: '60%', height: 40, borderRadius: radius.md },
});
