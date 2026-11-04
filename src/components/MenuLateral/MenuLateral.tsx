import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSizes, fonts, gradients, radius, spacing } from '../../theme';
import { iniciais } from '../../utils/iniciais';
import { Icon, type IconName } from '../Icon/Icon';

export type MenuLateralItem = {
  label: string;
  icon: IconName;
  onPress: () => void;
  testID?: string;
};

type Props = {
  visible: boolean;
  nome: string;
  /** Papel exibido abaixo do nome (ex.: "Paciente"). */
  papel: string;
  items: MenuLateralItem[];
  onLogout: () => void;
  onClose: () => void;
};

/**
 * Menu lateral (Figma "M3 Menu · Paciente"): painel à esquerda com avatar, nome, papel, atalhos e
 * "Sair". Tocar fora do painel, ou no voltar do Android, fecha o menu.
 */
export function MenuLateral({ visible, nome, papel, items, onLogout, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.raiz}>
        <SafeAreaView style={styles.painel} edges={['top', 'bottom', 'left']} testID="menu-lateral">
          <View style={styles.perfil}>
            <LinearGradient
              colors={gradients.hero.colors}
              start={gradients.hero.start}
              end={gradients.hero.end}
              style={styles.avatar}
            >
              <Text style={styles.avatarTexto}>{iniciais(nome)}</Text>
            </LinearGradient>
            <View style={styles.identidade}>
              <Text style={styles.nome} numberOfLines={1}>
                {nome}
              </Text>
              <Text style={styles.papel}>{papel}</Text>
            </View>
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
              testID={item.testID}
            >
              <Icon name={item.icon} size={20} color={colors.primary} />
              <Text style={styles.linkTexto}>{item.label}</Text>
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onClose();
              onLogout();
            }}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
            testID="menu-sair"
          >
            <Icon name="log-out" size={20} color={colors.danger} />
            <Text style={[styles.linkTexto, styles.sair]}>Sair</Text>
          </Pressable>
        </SafeAreaView>
        <Pressable
          style={styles.fora}
          onPress={onClose}
          accessibilityLabel="Fechar menu"
          testID="menu-lateral-fechar"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, flexDirection: 'row' },
  painel: {
    width: '82%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  fora: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.textInverse },
  identidade: { flex: 1, minWidth: 0 },
  nome: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.text },
  papel: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textTertiary },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  linkTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.text },
  sair: { color: colors.danger },
  pressed: { opacity: 0.7 },
});
