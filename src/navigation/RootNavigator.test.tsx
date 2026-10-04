import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AuthContext, type AuthContextValue } from '../contexts/AuthContext';
import { consultaService } from '../services/consultaService';
import { pacienteService } from '../services/pacienteService';
import { authValue, usuarioProfissional } from '../test/authContextValue';
import { Providers } from '../test/helpers';
import { RootNavigator } from './RootNavigator';

jest.mock('../services/consultaService', () => ({
  consultaService: { listarTodos: jest.fn(async () => []) },
}));
jest.mock('../services/pacienteService', () => ({
  pacienteService: { listarTodos: jest.fn(async () => []), cadastrarPublico: jest.fn() },
}));

async function renderRoot(parcial: Partial<AuthContextValue>) {
  const value = authValue(parcial);
  await render(
    <Providers>
      <AuthContext.Provider value={value}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthContext.Provider>
    </Providers>,
  );
  return value;
}

describe('RootNavigator (substitui authGuard/roleGuard)', () => {
  it('mostra o splash enquanto restaura a sessão', async () => {
    await renderRoot({ status: 'restoring', user: null });
    expect(screen.getByTestId('splash-restaurando')).toBeOnTheScreen();
  });

  it('mostra a tela de erro de conexão quando a restauração falha, sem deslogar', async () => {
    const value = await renderRoot({ status: 'restoreFailed', user: null });

    expect(screen.getByText('Não foi possível conectar')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('restore-retry'));
    expect(value.restore).toHaveBeenCalled();
    expect(value.logout).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('restore-sair'));
    expect(value.logout).toHaveBeenCalled();
  });

  it('usuário deslogado vê o login', async () => {
    await renderRoot({ status: 'signedOut', user: null });
    expect(screen.getByRole('header', { name: 'Entrar' })).toBeOnTheScreen();
  });

  it('profissional cai na home do profissional', async () => {
    await renderRoot({ status: 'signedIn', user: usuarioProfissional });

    expect(await screen.findByText('Bem-vindo(a),')).toBeOnTheScreen();
    expect(consultaService.listarTodos).toHaveBeenCalled();
    expect(pacienteService.listarTodos).toHaveBeenCalled();
  });

  it.each([
    ['ROLE_PACIENTE', 'A área do paciente chega no Batch 8.'],
    ['ROLE_ADMIN', 'A área do administrador chega no Batch 11.'],
    ['ROLE_DESCONHECIDO', 'Seu perfil de acesso não é reconhecido por este app.'],
  ])('%s cai num placeholder com "Sair"', async (role, mensagem) => {
    const value = await renderRoot({
      status: 'signedIn',
      user: { ...usuarioProfissional, role },
    });

    expect(screen.getByText(mensagem)).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('placeholder-sair'));
    expect(value.logout).toHaveBeenCalled();
  });
});
