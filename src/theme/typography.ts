/**
 * Nomes das famílias da fonte Inter (pesos 400–800), a mesma carregada via Google Fonts no
 * Angular. No Android, `fontWeight` não escolhe a variante de uma fonte customizada, então cada
 * peso é uma família própria. Os arquivos são carregados em `fontAssets.ts`.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Tamanhos convertidos dos `rem` do SCSS (1rem = 16px), arredondados. */
export const fontSizes = {
  xs: 12, // 0.75rem: eyebrows
  sm: 13, // 0.8–0.85rem: badges, subtítulos
  md: 14, // 0.9rem: textos secundários
  base: 15, // 0.95rem: corpo
  lg: 16, // 1rem: inputs
  xl: 18, // 1.1rem: títulos de seção
  xxl: 26, // 1.6rem: saudação e valores
  display: 38, // 2.4rem: hora do hero
} as const;
