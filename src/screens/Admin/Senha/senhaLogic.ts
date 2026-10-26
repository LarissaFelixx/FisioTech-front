import { mensagemDeErro } from '../../../utils/mensagensErro';
import {
  maximo,
  minimo,
  obrigatorio,
  validarFormulario,
  type Schema,
} from '../../../utils/validation';

/** Regras do Alterar Senha do administrador (#36; origem: `features/admin/admin-senha`). */

export type SenhaCampos = 'senhaAtual' | 'novaSenha' | 'confirmarNovaSenha';
export type SenhaFormValues = Record<SenhaCampos, string>;

export const SENHA_VAZIA: SenhaFormValues = {
  senhaAtual: '',
  novaSenha: '',
  confirmarNovaSenha: '',
};

const schemaSenha: Schema<SenhaCampos> = {
  senhaAtual: [obrigatorio],
  novaSenha: [obrigatorio, minimo(8), maximo(100)],
  confirmarNovaSenha: [obrigatorio],
};

export const MENSAGEM_SENHAS_DIFERENTES = 'As senhas não coincidem.';

/** Validações do Angular, incluindo a confirmação igual à nova senha. */
export function validarSenha(v: SenhaFormValues): Partial<Record<SenhaCampos, string>> {
  const erros = validarFormulario(v, schemaSenha);
  if (!erros.confirmarNovaSenha && v.confirmarNovaSenha !== v.novaSenha) {
    erros.confirmarNovaSenha = MENSAGEM_SENHAS_DIFERENTES;
  }
  return erros;
}

export const MENSAGEM_SENHA_ALTERADA = 'Senha alterada com sucesso.';

/** 400 do backend = senha atual incorreta (como no Angular). */
export function mensagemErroSenha(error: unknown): string {
  return mensagemDeErro(
    error,
    { 400: 'Senha atual incorreta.' },
    'Não foi possível alterar a senha. Tente novamente.',
  );
}
