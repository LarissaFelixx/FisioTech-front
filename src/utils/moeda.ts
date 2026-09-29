/** `150` → "R$ 150,00"; `1234.5` → "R$ 1.234,50" (equivalente ao `currency: 'BRL'` do Angular). */
export function formatMoeda(valor: number): string {
  const [inteiro, centavos] = Math.abs(valor).toFixed(2).split('.');
  const milhares = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${valor < 0 ? '-' : ''}R$ ${milhares},${centavos}`;
}

/**
 * Lê um valor digitado ("150", "150,50", "1.234,50" ou "150.5"). Vazio vira `null`;
 * texto que não é número vira `NaN` (para a validação acusar).
 */
export function lerValor(texto: string): number | null {
  const t = texto.trim();
  if (!t) {
    return null;
  }
  const normalizado = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  return /^\d+(\.\d{1,2})?$/.test(normalizado) ? Number(normalizado) : NaN;
}
