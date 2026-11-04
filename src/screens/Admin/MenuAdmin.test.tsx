import { fireEvent, render, screen } from '@testing-library/react-native';

import { MenuLateral } from '../../components/MenuLateral/MenuLateral';
import { AuthContext } from '../../contexts/AuthContext';
import { AdminNavigator } from '../../navigation/AdminNavigator';
import { authValue, usuarioProfissional } from '../../test/authContextValue';
import { Providers } from '../../test/helpers';

const admin = { ...usuarioProfissional, nome: 'Administrador', role: 'ROLE_ADMIN' };

async function montar() {
  const value = authValue({ user: admin });
  await render(
    <Providers navigation>
      <AuthContext.Provider value={value}>
        <AdminNavigator />
      </AuthContext.Provider>
    </Providers>,
  );
  return value;
}

describe('MenuLateral', () => {
  it('mostra iniciais, nome e papel; cada item fecha o menu e executa a ação', async () => {
    const onClose = jest.fn();
    const onLogout = jest.fn();
    const alterarSenha = jest.fn();
    await render(
      <MenuLateral
        visible
        nome="Administrador"
        papel="Admin"
        onClose={onClose}
        onLogout={onLogout}
        items={[{ label: 'Alterar Senha', icon: 'lock', onPress: alterarSenha }]}
      />,
    );

    // `iniciais()` segue o Angular: nome de uma palavra só dá uma inicial (o Figma mostra "AD").
    expect(screen.getByText('A')).toBeOnTheScreen();
    expect(screen.getByText('Administrador')).toBeOnTheScreen();
    expect(screen.getByText('Admin')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Alterar Senha' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(alterarSenha).toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onLogout).toHaveBeenCalled();
  });

  it('tocar fora do painel fecha o menu', async () => {
    const onClose = jest.fn();
    await render(
      <MenuLateral
        visible
        nome="Administrador"
        papel="Admin"
        onClose={onClose}
        onLogout={jest.fn()}
        items={[]}
      />,
    );

    await fireEvent.press(screen.getByTestId('menu-lateral-fechar'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Menu do administrador (#37)', () => {
  it('começa fechado na aba Profissionais e abre pelo botão de menu', async () => {
    await montar();

    expect(screen.getByRole('header', { name: 'Profissionais' })).toBeOnTheScreen();
    expect(screen.queryByTestId('menu-lateral')).toBeNull();

    await fireEvent.press(screen.getByTestId('admin-abrir-menu'));
    expect(screen.getByTestId('menu-lateral')).toBeOnTheScreen();
    expect(screen.getByText('Administrador')).toBeOnTheScreen();
    expect(screen.getByText('Admin')).toBeOnTheScreen();
  });

  it('"Alterar Senha" fecha o menu e abre a troca de senha', async () => {
    await montar();

    await fireEvent.press(screen.getByTestId('admin-abrir-menu'));
    await fireEvent.press(screen.getByTestId('menu-alterar-senha'));

    expect(await screen.findByRole('header', { name: 'Alterar Senha' })).toBeOnTheScreen();
    expect(screen.queryByTestId('menu-lateral')).toBeNull();
  });

  it('"Sair" encerra a sessão', async () => {
    const value = await montar();

    await fireEvent.press(screen.getByTestId('admin-abrir-menu'));
    await fireEvent.press(screen.getByTestId('menu-sair'));

    expect(value.logout).toHaveBeenCalled();
  });

  it('o menu também abre na aba Pacientes', async () => {
    await montar();

    await fireEvent.press(screen.getByTestId('tab-pacientes'));
    expect(await screen.findByRole('header', { name: 'Pacientes' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('admin-abrir-menu'));
    expect(screen.getByTestId('menu-lateral')).toBeOnTheScreen();
  });
});
