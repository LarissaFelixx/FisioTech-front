import type { View } from 'react-native';

export type Medida = { y: number; height: number };

/** Posição vertical e altura do elemento na janela; `null` se ele já saiu da tela. */
export function medirNaJanela(
  alvo: Pick<View, 'measureInWindow'> | null | undefined,
): Promise<Medida | null> {
  if (!alvo) return Promise.resolve(null);
  return new Promise((resolve) => {
    alvo.measureInWindow((_x, y, _width, height) => resolve({ y, height }));
  });
}
