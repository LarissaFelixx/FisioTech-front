/** Até duas iniciais maiúsculas do nome (origem: `iniciais()` repetido nas telas do Angular). */
export function iniciais(nome: string | null | undefined): string {
  if (!nome) {
    return '';
  }
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}
