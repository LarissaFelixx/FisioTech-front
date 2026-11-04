import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon/Icon';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';

type Props = {
  titulo: string;
  onAbrirMenu: () => void;
  /** Ação à direita do título (ex.: o "+" de novo cadastro). */
  acao?: ReactNode;
};

/** Cabeçalho das abas do admin (Figma "12 Admin · Profissionais"): botão de menu e título. */
export function AdminCabecalho({ titulo, onAbrirMenu, acao }: Props) {
  return (
    <View style={styles.cabecalho}>
      <Pressable
        onPress={onAbrirMenu}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
        hitSlop={8}
        style={({ pressed }) => [styles.menu, pressed && styles.pressed]}
        testID="admin-abrir-menu"
      >
        <Icon name="menu" size={18} color={colors.text} />
      </Pressable>
      <Text style={styles.titulo} accessibilityRole="header" numberOfLines={1}>
        {titulo}
      </Text>
      {acao}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menu: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  titulo: {
    flex: 1,
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  pressed: { opacity: 0.7 },
});
