import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';

export interface ConfirmOptions {
  titulo: string;
  mensagem: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  /** Estiliza o botão de confirmar como ação destrutiva (vermelho). Padrão: true. */
  destrutivo?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * Diálogo de confirmação baseado em Promise (origem: `core/ui/confirm-dialog`).
 * Uso: `const confirmar = useConfirm(); if (await confirmar({...})) { ... }`.
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((confirmado: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((novas) => {
    // Um pedido novo cancela o anterior, se ainda estiver aberto.
    resolver.current?.(false);
    setOptions(novas);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const responder = useCallback((confirmado: boolean) => {
    resolver.current?.(confirmado);
    resolver.current = null;
    setOptions(null);
  }, []);

  const value = useMemo(() => confirm, [confirm]);
  const destrutivo = options?.destrutivo !== false;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        visible={options !== null}
        transparent
        animationType="fade"
        onRequestClose={() => responder(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => responder(false)}
          accessibilityLabel="Fechar"
          testID="confirm-overlay"
        >
          {options ? (
            <Pressable
              style={styles.card}
              accessibilityRole="alert"
              accessibilityLabel={options.titulo}
              onPress={() => undefined}
            >
              <Text style={styles.title}>{options.titulo}</Text>
              <Text style={styles.message}>{options.mensagem}</Text>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => responder(false)}
                  style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}
                  testID="confirm-cancelar"
                >
                  <Text style={styles.cancelText}>{options.cancelarLabel ?? 'Cancelar'}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => responder(true)}
                  style={({ pressed }) => [
                    styles.button,
                    destrutivo ? styles.confirmDestrutivo : styles.confirm,
                    pressed && styles.pressed,
                  ]}
                  testID="confirm-confirmar"
                >
                  <Text style={styles.confirmText}>{options.confirmarLabel ?? 'Confirmar'}</Text>
                </Pressable>
              </View>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm precisa estar dentro de <ConfirmDialogProvider>.');
  }
  return confirm;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.text },
  message: { fontFamily: fonts.regular, fontSize: fontSizes.base, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  button: { flex: 1, paddingVertical: 12, borderRadius: radius.pill, alignItems: 'center' },
  cancel: { backgroundColor: colors.bg },
  confirm: { backgroundColor: colors.primary },
  confirmDestrutivo: { backgroundColor: colors.danger },
  cancelText: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.text },
  confirmText: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.textInverse },
  pressed: { opacity: 0.8 },
});
