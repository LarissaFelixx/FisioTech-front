import { render, screen } from '@testing-library/react-native';
import { useFonts } from 'expo-font';

import App from './App';

jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: jest.fn(),
}));

const mockedUseFonts = jest.mocked(useFonts);

describe('App', () => {
  it('mostra o carregamento enquanto a fonte Inter não carrega', async () => {
    mockedUseFonts.mockReturnValue([false, null]);

    await render(<App />);

    expect(screen.getByTestId('app-loading')).toBeOnTheScreen();
  });

  it('abre na tela placeholder de login quando as fontes carregam', async () => {
    mockedUseFonts.mockReturnValue([true, null]);

    await render(<App />);

    expect(await screen.findByText('Entrar')).toBeOnTheScreen();
    expect(screen.getByText('FisioTech')).toBeOnTheScreen();
  });

  it('não trava se a fonte falhar: segue com a fonte do sistema', async () => {
    mockedUseFonts.mockReturnValue([false, new Error('falha ao carregar fonte')]);

    await render(<App />);

    expect(await screen.findByText('Entrar')).toBeOnTheScreen();
  });
});
