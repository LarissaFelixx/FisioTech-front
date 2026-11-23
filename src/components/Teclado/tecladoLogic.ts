import { Platform, StatusBar, type KeyboardEvent } from 'react-native';

import { spacing } from '../../theme';

/** Espaço livre acima do campo ao rolar: cabe o rótulo do `TextField`. */
export const FOLGA_TOPO = 32;
/** Espaço livre entre o campo e o topo do teclado (ou do rodapé que sobe com ele). */
export const FOLGA_BASE = spacing.xl;

type Rolagem = {
  /** Topo do campo em relação ao topo visível da rolagem. */
  campoTopo: number;
  campoAltura: number;
  /** Deslocamento atual da rolagem (`contentOffset.y`). */
  rolagemAtual: number;
  /** Altura da rolagem que não está coberta pelo teclado. */
  alturaVisivel: number;
};

/**
 * Para onde rolar para o campo focado ficar inteiro à vista, com folga; `null` se já está.
 * Campo maior que a área visível (multilinha) fica alinhado pelo topo, onde começa o texto.
 */
export function calcularRolagem({
  campoTopo,
  campoAltura,
  rolagemAtual,
  alturaVisivel,
}: Rolagem): number | null {
  if (alturaVisivel <= 0) return null;
  const topo = campoTopo - FOLGA_TOPO;
  const base = campoTopo + campoAltura + FOLGA_BASE;

  if (topo < 0 || (base > alturaVisivel && base - topo > alturaVisivel)) {
    const destino = Math.max(0, rolagemAtual + topo);
    return destino === rolagemAtual ? null : destino;
  }
  if (base > alturaVisivel) return rolagemAtual + base - alturaVisivel;
  return null;
}

/** Quanto o teclado cobre da área: base da área na janela menos o topo do teclado. */
export function sobreposicaoTeclado(areaBase: number, tecladoTopo: number): number {
  return Math.max(0, Math.round(areaBase - tecladoTopo));
}

type Teclado = {
  plataforma: string;
  /** `endCoordinates.screenY` do evento: topo do teclado na tela. */
  screenY: number;
  /** `StatusBar.currentHeight` (só existe no Android). */
  barraDeStatus: number;
};

/**
 * Topo do teclado no mesmo referencial do `measureInWindow`. No Android o `measureInWindow`
 * conta a partir de baixo da barra de status, e o `screenY` conta do topo da tela: sem
 * descontar a barra, a área encolhia ~49dp a menos e o botão do rodapé ficava atrás do teclado.
 */
export function topoDoTeclado({ plataforma, screenY, barraDeStatus }: Teclado): number {
  return plataforma === 'android' ? screenY - barraDeStatus : screenY;
}

/** `topoDoTeclado` para um evento do teclado nesta plataforma. */
export function topoDoTecladoNaJanela(e: KeyboardEvent): number {
  return topoDoTeclado({
    plataforma: Platform.OS,
    screenY: e.endCoordinates.screenY,
    barraDeStatus: StatusBar.currentHeight ?? 0,
  });
}
