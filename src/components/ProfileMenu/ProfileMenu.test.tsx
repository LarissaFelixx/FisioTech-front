import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProfileMenu } from './ProfileMenu';

describe('ProfileMenu', () => {
  it('mostra nome e itens; cada ação fecha o menu antes de executar', async () => {
    const onClose = jest.fn();
    const onLogout = jest.fn();
    const onSenha = jest.fn();
    await render(
      <ProfileMenu
        visible
        nome="Dra. Ana Lima"
        items={[{ label: 'Alterar Senha', icon: 'lock', onPress: onSenha }]}
        onLogout={onLogout}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Dra. Ana Lima')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Alterar Senha'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSenha).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('menu-sair'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
