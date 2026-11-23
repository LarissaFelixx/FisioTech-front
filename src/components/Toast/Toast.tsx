import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';

/** Tempo que o toast fica na tela antes de começar a sumir. */
export const DURACAO_TOAST_MS = 3000;
const FADE_MS = 200;

type Props = {
  mensagem: string;
  /** Chamado quando o toast termina de sumir. */
  onFechar: () => void;
  duracao?: number;
};

/**
 * Aviso curto que some sozinho e não bloqueia toques. Fica logo acima do elemento pai (por exemplo,
 * o rodapé com o botão), por isso o pai não deve cortar o que passa dos seus limites.
 */
export function Toast({ mensagem, onFechar, duracao = DURACAO_TOAST_MS }: Props) {
  const [opacidade] = useState(() => new Animated.Value(0));
  const fechar = useRef(onFechar);

  useEffect(() => {
    fechar.current = onFechar;
  }, [onFechar]);

  useEffect(() => {
    // No Android o accessibilityLiveRegion já anuncia; no iOS é preciso pedir.
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(mensagem);
    }
    Animated.timing(opacidade, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start();
    const sumir = setTimeout(() => {
      Animated.timing(opacidade, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start();
    }, duracao);
    // A remoção não depende do fim da animação: com redução de movimento ela pode não terminar.
    const remover = setTimeout(() => fechar.current(), duracao + FADE_MS);
    return () => {
      clearTimeout(sumir);
      clearTimeout(remover);
    };
  }, [mensagem, duracao, opacidade]);

  return (
    <Animated.View style={[styles.posicao, { opacity: opacidade }]}>
      <View style={styles.caixa}>
        <Text style={styles.texto} accessibilityLiveRegion="polite" testID="toast">
          {mensagem}
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * Estado do toast de uma tela: `mostrarToast` exibe (ou reinicia, se já houver um na tela) e
 * `toast` é o elemento a renderizar dentro do pai onde ele deve aparecer.
 */
export function useToast() {
  const [atual, setAtual] = useState<{ id: number; mensagem: string } | null>(null);
  const mostrarToast = useCallback(
    (mensagem: string) => setAtual((a) => ({ id: (a?.id ?? 0) + 1, mensagem })),
    [],
  );
  const fechar = useCallback(() => setAtual(null), []);
  const toast = atual ? <Toast key={atual.id} mensagem={atual.mensagem} onFechar={fechar} /> : null;
  return { toast, mostrarToast };
}

const styles = StyleSheet.create({
  posicao: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: '100%',
    marginBottom: spacing.md,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  caixa: {
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  texto: {
    color: colors.textInverse,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
});
