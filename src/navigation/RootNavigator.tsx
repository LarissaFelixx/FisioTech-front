import { useAuth } from '../hooks/useAuth';
import { PlaceholderScreen } from '../screens/Placeholder/PlaceholderScreen';
import { RestoreErrorScreen } from '../screens/RestoreError/RestoreErrorScreen';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { ROLES } from '../types/auth';
import { AuthStack } from './AuthStack';
import { PacienteNavigator } from './PacienteNavigator';
import { ProfissionalNavigator } from './ProfissionalNavigator';

/**
 * Navegação condicional (substitui `authGuard`, `roleGuard` e `homeRouteFor` do Angular):
 * cada perfil só enxerga o próprio navegador.
 */
export function RootNavigator() {
  const { status, user, logout } = useAuth();

  if (status === 'restoring') {
    return <SplashScreen />;
  }
  if (status === 'restoreFailed') {
    return <RestoreErrorScreen />;
  }
  if (status === 'signedOut' || !user) {
    return <AuthStack />;
  }

  const sair = { label: 'Sair', onPress: () => void logout(), testID: 'placeholder-sair' };

  switch (user.role) {
    case ROLES.profissional:
      return <ProfissionalNavigator />;
    case ROLES.paciente:
      return <PacienteNavigator />;
    case ROLES.admin:
      return (
        <PlaceholderScreen
          title={`Olá, ${user.nome}`}
          message="A área do administrador chega no Batch 11."
          action={sair}
        />
      );
    default:
      return (
        <PlaceholderScreen
          title="Perfil não suportado"
          message="Seu perfil de acesso não é reconhecido por este app."
          action={sair}
        />
      );
  }
}
