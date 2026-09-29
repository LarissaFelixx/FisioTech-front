import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';
import { Avatar } from '../Avatar/Avatar';
import { Icon, type IconName } from '../Icon/Icon';

export type ProfileMenuItem = {
  label: string;
  icon: IconName;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  nome: string;
  items: ProfileMenuItem[];
  onLogout: () => void;
  onClose: () => void;
};

/**
 * Menu do usuário (equivalente à sidebar do Shell do Angular): perfil, atalhos e "Sair".
 * Aparece como uma folha inferior.
 */
export function ProfileMenu({ visible, nome, items, onLogout, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        accessibilityLabel="Fechar menu"
        testID="profile-menu-overlay"
      />
      <View style={[styles.sheet, { paddingBottom: spacing.xxl + insets.bottom }]}>
        <View style={styles.profile}>
          <Avatar nome={nome} size={48} shape="circle" />
          <Text style={styles.nome} numberOfLines={1}>
            {nome}
          </Text>
        </View>

        {items.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              item.onPress();
            }}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Icon name={item.icon} size={20} color={colors.textSecondary} />
            <Text style={styles.linkTexto}>{item.label}</Text>
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onClose();
            onLogout();
          }}
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
          testID="menu-sair"
        >
          <Text style={styles.logoutTexto}>Sair</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  nome: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  linkTexto: { fontFamily: fonts.medium, fontSize: fontSizes.base, color: colors.text },
  logout: {
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  logoutTexto: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.danger },
  pressed: { opacity: 0.7 },
});
