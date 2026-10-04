import { render, screen } from '@testing-library/react-native';
import { useFonts } from 'expo-font';

import App from './App';
import { secureTokenStorage } from './services/tokenStorage';

jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: jest.fn(),
}));

jest.mock('./services/tokenStorage', () => ({
  secureTokenStorage: {
    getRefreshToken: jest.fn(async () => null),
    setRefreshToken: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
  },
}));

const mockedUseFonts = jest.mocked(useFonts);

describe('App', () => {
  it('mostra o carregamento enquanto a fonte Inter não carrega', async () => {
    mockedUseFonts.mockReturnValue([false, null]);

    await render(<App />);

    expect(screen.getByTestId('app-loading')).toBeOnTheScreen();
  });

  it('sem sessão salva, abre no login', async () => {
    mockedUseFonts.mockReturnValue([true, null]);

    await render(<App />);

    expect(await screen.findByRole('header', { name: 'Entrar' })).toBeOnTheScreen();
    expect(secureTokenStorage.getRefreshToken).toHaveBeenCalled();
  });

  it('não trava se a fonte falhar: segue com a fonte do sistema', async () => {
    mockedUseFonts.mockReturnValue([false, new Error('falha ao carregar fonte')]);

    await render(<App />);

    expect(await screen.findByRole('header', { name: 'Entrar' })).toBeOnTheScreen();
  });
});
