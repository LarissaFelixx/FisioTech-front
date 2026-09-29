import { Platform, type ViewStyle } from 'react-native';

/** Espaçamentos mais usados nos SCSS do Angular (em px/dp). */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** `--radius-sm`, `--radius-md`, `--radius-pill`, mais o raio dos icon tiles (12). */
export const radius = {
  tile: 12,
  sm: 14,
  md: 20,
  pill: 999,
} as const;

/** `--shadow-card: 0 6px 20px rgba(20, 30, 40, 0.06)`, com elevation no Android. */
export const shadows: { card: ViewStyle } = {
  card: Platform.select<ViewStyle>({
    android: { elevation: 2, shadowColor: 'rgb(20, 30, 40)' },
    default: {
      shadowColor: 'rgb(20, 30, 40)',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
    },
  }),
};
