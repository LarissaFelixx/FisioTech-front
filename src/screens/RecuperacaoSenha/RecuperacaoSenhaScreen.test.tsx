import { fireEvent, render, screen } from '@testing-library/react-native';

import { RecuperacaoSenhaScreen } from './RecuperacaoSenhaScreen';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
}));

const preencher = (texto: string) =>
  fireEvent.changeText(screen.getByTestId('recuperacao-email'), texto);
const tocar = (testID: string) => fireEvent.press(screen.getByTestId(testID));

beforeEach(() => {
  mockGoBack.mockClear();
  mockNavigate.mockClear();
});

describe('RecuperacaoSenhaScreen', () => {
  it('mostra o título e o campo de email', async () => {
    await render(<RecuperacaoSenhaScreen />);

    expect(screen.getByRole('header', { name: 'Recuperar senha' })).toBeOnTheScreen();
    expect(screen.getByTestId('recuperacao-email')).toBeOnTheScreen();
  });

  it('valida o email antes de enviar', async () => {
    await render(<RecuperacaoSenhaScreen />);

    await tocar('recuperacao-enviar');
    expect(screen.getByText('Este campo é obrigatório.')).toBeOnTheScreen();

    await preencher('nao-e-email');
    await tocar('recuperacao-enviar');
    expect(screen.getByText('Email inválido.')).toBeOnTheScreen();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('avança para a redefinição com o email (sem espaços)', async () => {
    await render(<RecuperacaoSenhaScreen />);

    await preencher(' ana.souza@clinica.br ');
    await tocar('recuperacao-enviar');

    expect(mockNavigate).toHaveBeenCalledWith('RedefinirSenha', {
      email: 'ana.souza@clinica.br',
    });
  });

  it('volta para o login', async () => {
    await render(<RecuperacaoSenhaScreen />);

    await tocar('recuperacao-voltar');

    expect(mockGoBack).toHaveBeenCalled();
  });
});
