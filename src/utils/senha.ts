import { mensagemDeErro } from './mensagensErro';
import { maximo, minimo, obrigatorio, validarFormulario, type Schema } from './validation';

/**
 * Regras da troca da própria senha, iguais nos três perfis (origem: `profissional-senha`,
 * `paciente-senha` e `admin-senha` do Angular; `AlterarSenhaRequest` do backend).
 */

export type SenhaCampos = 'senhaAtual' | 'novaSenha' | 'confirmarNovaSenha';
export type SenhaFormValues = Record<SenhaCampos, string>;

export const SENHA_VAZIA: SenhaFormValues = {
  senhaAtual: '',
  novaSenha: '',
  confirmarNovaSenha: '',
};

const schemaSenha: Schema<SenhaCampos> = {
  senhaAtual: [obrigatorio],
  // `@Size(min = 8, max = 100)` no backend.
  novaSenha: [obrigatorio, minimo(8), maximo(100)],
  confirmarNovaSenha: [obrigatorio],
};

export const MENSAGEM_SENHAS_DIFERENTES = 'As senhas não coincidem.';
export const MENSAGEM_SENHA_IGUAL = 'A nova senha deve ser diferente da atual.';
export const MENSAGEM_SENHA_ALTERADA = 'Senha alterada com sucesso.';

/** Validações do Angular, mais a nova senha diferente da atual. */
export function validarSenha(v: SenhaFormValues): Partial<Record<SenhaCampos, string>> {
  const erros = validarFormulario(v, schemaSenha);
  if (!erros.novaSenha && v.senhaAtual && v.novaSenha === v.senhaAtual) {
    erros.novaSenha = MENSAGEM_SENHA_IGUAL;
  }
  if (!erros.confirmarNovaSenha && v.confirmarNovaSenha !== v.novaSenha) {
    erros.confirmarNovaSenha = MENSAGEM_SENHAS_DIFERENTES;
  }
  return erros;
}

/** 400 do backend = senha atual incorreta (como no Angular). */
export function mensagemErroSenha(error: unknown): string {
  return mensagemDeErro(
    error,
    { 400: 'Senha atual incorreta.' },
    'Não foi possível alterar a senha. Tente novamente.',
  );
}
