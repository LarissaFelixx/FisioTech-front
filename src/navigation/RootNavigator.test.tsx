import { NavigationContainer } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';

import { RootNavigator } from './RootNavigator';

function renderNavigator(isSignedIn: boolean) {
  return render(
    <NavigationContainer>
      <RootNavigator isSignedIn={isSignedIn} />
    </NavigationContainer>,
  );
}

describe('RootNavigator', () => {
  it('mostra o fluxo de autenticação para quem não está logado', async () => {
    await renderNavigator(false);

    expect(await screen.findByText('Entrar')).toBeOnTheScreen();
    expect(screen.queryByText('Home')).not.toBeOnTheScreen();
  });

  it('mostra o stack principal para quem está logado', async () => {
    await renderNavigator(true);

    expect(await screen.findByText('Home')).toBeOnTheScreen();
    expect(screen.queryByText('Entrar')).not.toBeOnTheScreen();
  });
});
