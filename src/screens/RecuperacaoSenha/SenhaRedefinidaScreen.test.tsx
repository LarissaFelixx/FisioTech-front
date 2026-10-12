import { fireEvent, render, screen } from '@testing-library/react-native';

import { SenhaRedefinidaScreen } from './SenhaRedefinidaScreen';

const mockPopTo = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popTo: mockPopTo }),
}));

describe('SenhaRedefinidaScreen', () => {
  it('confirma a redefinição e avisa que todas as sessões foram encerradas', async () => {
    await render(<SenhaRedefinidaScreen />);

    expect(screen.getByRole('header', { name: 'Senha redefinida' })).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Por segurança, você saiu de todos os dispositivos. Entre novamente com a nova senha.',
      ),
    ).toBeOnTheScreen();
  });

  it('volta para o login', async () => {
    await render(<SenhaRedefinidaScreen />);

    await fireEvent.press(screen.getByTestId('senha-redefinida-login'));

    expect(mockPopTo).toHaveBeenCalledWith('Login');
  });
});
