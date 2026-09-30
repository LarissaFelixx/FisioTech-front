/**
 * Validação de formulários. Substitui os `Validators` do Angular e as mensagens de
 * `core/forms/field-error.ts`, mantendo os mesmos textos.
 */
export type Rule = (valor: string) => string | null;

export const MENSAGENS = {
  obrigatorio: 'Este campo é obrigatório.',
  email: 'Email inválido.',
  minimo: (n: number) => `Deve ter pelo menos ${n} caracteres.`,
  maximo: (n: number) => `Deve ter no máximo ${n} caracteres.`,
} as const;

// Mesma expressão usada por `Validators.email` do Angular.
const EMAIL_REGEXP =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const obrigatorio: Rule = (v) => (v.trim().length === 0 ? MENSAGENS.obrigatorio : null);

/** Como no Angular, valor vazio não é validado aqui (fica a cargo de `obrigatorio`). */
export const email: Rule = (v) => (v.length > 0 && !EMAIL_REGEXP.test(v) ? MENSAGENS.email : null);

export const minimo =
  (n: number): Rule =>
  (v) =>
    v.length > 0 && v.length < n ? MENSAGENS.minimo(n) : null;

export const maximo =
  (n: number): Rule =>
  (v) =>
    v.length > n ? MENSAGENS.maximo(n) : null;

/** Primeira mensagem de erro das regras, na ordem informada. */
export function validar(valor: string, regras: Rule[]): string | null {
  for (const regra of regras) {
    const erro = regra(valor);
    if (erro) {
      return erro;
    }
  }
  return null;
}

export type Schema<K extends string> = Record<K, Rule[]>;

/** Valida todos os campos; retorna só os campos com erro. */
export function validarFormulario<K extends string>(
  valores: Record<K, string>,
  schema: Schema<K>,
): Partial<Record<K, string>> {
  const erros: Partial<Record<K, string>> = {};
  for (const campo of Object.keys(schema) as K[]) {
    const erro = validar(valores[campo], schema[campo]);
    if (erro) {
      erros[campo] = erro;
    }
  }
  return erros;
}
