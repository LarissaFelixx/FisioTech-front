/**
 * Extrai o id do recurso criado do header `Location` (ex.: `http://host/consultas/42` → 42),
 * como fazia o `ConsultaService.criar` do Angular.
 */
export function idDoLocation(location: string | undefined | null): number {
  const valor = location ?? '';
  const id = Number(valor.substring(valor.lastIndexOf('/') + 1));
  if (!valor || !Number.isInteger(id) || id <= 0) {
    throw new Error(`Resposta de criação sem um header Location válido: "${valor}".`);
  }
  return id;
}
