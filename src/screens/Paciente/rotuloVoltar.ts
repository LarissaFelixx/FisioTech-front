import { useNavigationState } from '@react-navigation/native';

/** Rota de onde a tela foi aberta, no formato do estado do React Navigation. */
export interface RotaAnterior {
  name: string;
  state?: { index?: number; routes: { name: string }[] };
}

const ROTULO_ABA: Record<string, string> = {
  Home: 'Home',
  Consultas: 'Minhas Consultas',
  Mensagens: 'Mensagens',
  Perfil: 'Meu Perfil',
};

/**
 * Rótulo do "‹ Voltar" das telas empilhadas sobre as abas do paciente: a aba de onde ele veio.
 * Sem estado aninhado, as abas ainda estão na inicial (Home); vinda de outra tela empilhada,
 * fica o `padrao`.
 */
export function rotuloVoltar(anterior: RotaAnterior | undefined, padrao: string): string {
  if (anterior?.name !== 'Tabs') {
    return padrao;
  }
  const aba = anterior.state ? anterior.state.routes[anterior.state.index ?? 0]?.name : 'Home';
  return ROTULO_ABA[aba ?? ''] ?? padrao;
}

export function useRotuloVoltar(padrao: string): string {
  return useNavigationState((state) => rotuloVoltar(state.routes[state.index - 1], padrao));
}
