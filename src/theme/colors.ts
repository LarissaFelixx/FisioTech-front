/**
 * Paleta extraída de `src/styles.scss` do app Angular (design AgedaFisio).
 * Os nomes seguem as CSS custom properties originais, sem o prefixo `--color-`.
 */
export const colors = {
  primary: '#0f9aa3',
  primaryDark: '#0b767d',
  accent: '#8b90f0',
  accentDark: '#6d72e0',
  success: '#2fbf71',
  danger: '#e15c5c',

  bg: '#eef1f2',
  surface: '#ffffff',
  border: '#e4e8ea',
  divider: '#f0f2f3',

  text: '#151a1e',
  textSecondary: '#5b6670',
  textTertiary: '#8a97a0',
  textInverse: '#ffffff',

  navInactive: '#a7b0b6',
} as const;

export type AvatarTint = 'blue' | 'orange' | 'green' | 'purple';

export const tints: Record<AvatarTint, { bg: string; fg: string }> = {
  blue: { bg: '#e7f0fe', fg: '#4f7ad9' },
  orange: { bg: '#fdeee2', fg: '#e0854a' },
  green: { bg: '#eaf7ec', fg: '#3aab55' },
  purple: { bg: '#f4e9fc', fg: '#8b5fc9' },
};

export const statusColors = {
  confirmada: { bg: '#e7f7f8', fg: '#0b767d' },
  agendada: { bg: '#f0f2f3', fg: '#5b6670' },
  cancelada: { bg: '#fdeaea', fg: '#d84343' },
} as const;

/** `--gradient-hero: linear-gradient(145deg, #20c4cd, #0b767d)` */
export const gradients = {
  hero: {
    colors: ['#20c4cd', '#0b767d'] as const,
    // 145deg no CSS ≈ do canto superior esquerdo para o inferior direito.
    start: { x: 0.2, y: 0 },
    end: { x: 0.8, y: 1 },
  },
} as const;
