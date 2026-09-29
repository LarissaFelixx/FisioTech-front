import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';

type Props = {
  /** Vem do AuthContext a partir do Batch 2. */
  isSignedIn: boolean;
};

/**
 * Navegação condicional (substitui o authGuard/roleGuard do Angular):
 * quem não está autenticado só enxerga o AuthStack.
 */
export function RootNavigator({ isSignedIn }: Props) {
  return isSignedIn ? <MainStack /> : <AuthStack />;
}
