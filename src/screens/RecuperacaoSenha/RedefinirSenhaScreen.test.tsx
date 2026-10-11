import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  MENSAGEM_CODIGO_INVALIDO,
  MENSAGEM_RECUPERACAO_INDISPONIVEL,
  MENSAGEM_SENHAS_DIFERENTES,
  RedefinirSenhaScreen,
} from './RedefinirSenhaScreen';

const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ reset: mockReset }),
  useRoute: () => ({ params: { email: 'ana.souza@clinica.br' } }),
}));

beforeEach(() => {
  mockReset.mockClear();
});

const preencher = (testID: string, texto: string) =>
  fireEvent.changeText(screen.getByTestId(testID), texto);
const tocar = (testID: string) => fireEvent.press(screen.getByTestId(testID));

async function preencherFormulario(codigo: string, senha: string, confirmacao: string) {
  await preencher('redefinir-codigo', codigo);
  await preencher('redefinir-nova-senha', senha);
  await preencher('redefinir-confirmar-senha', confirmacao);
}

describe('RedefinirSenhaScreen', () => {
  it('mostra o título e o email que recebeu o código', async () => {
    await render(<RedefinirSenhaScreen />);

    expect(screen.getByRole('header', { name: 'Redefinir senha' })).toBeOnTheScreen();
    expect(screen.getByText('ana.souza@clinica.br')).toBeOnTheScreen();
    expect(screen.getByText('Mínimo de 8 caracteres.')).toBeOnTheScreen();
  });

  it('exige todos os campos', async () => {
    await render(<RedefinirSenhaScreen />);

    await tocar('redefinir-enviar');

    expect(screen.getAllByText('Este campo é obrigatório.')).toHaveLength(3);
    expect(screen.queryByTestId('redefinir-erro')).not.toBeOnTheScreen();
  });

  it('valida o código, o tamanho da senha e a confirmação', async () => {
    await render(<RedefinirSenhaScreen />);

    await preencherFormulario('123', '1234', '12345678');
    await tocar('redefinir-enviar');

    expect(screen.getByText(MENSAGEM_CODIGO_INVALIDO)).toBeOnTheScreen();
    expect(screen.getByText('Deve ter pelo menos 8 caracteres.')).toBeOnTheScreen();
    expect(screen.getByText(MENSAGEM_SENHAS_DIFERENTES)).toBeOnTheScreen();
  });

  it('não avança com o formulário inválido', async () => {
    await render(<RedefinirSenhaScreen />);

    await preencherFormulario('482915', '12345678', '87654321');
    await tocar('redefinir-enviar');

    expect(mockReset).not.toHaveBeenCalled();
  });

  it('com o formulário válido, mostra a confirmação por cima do Login', async () => {
    await render(<RedefinirSenhaScreen />);

    await preencherFormulario('482915', '12345678', '12345678');
    await tocar('redefinir-enviar');

    expect(mockReset).toHaveBeenCalledWith({
      index: 1,
      routes: [{ name: 'Login' }, { name: 'SenhaRedefinida' }],
    });
  });

  it('reenviar código avisa que a recuperação ainda não está disponível', async () => {
    await render(<RedefinirSenhaScreen />);

    await tocar('redefinir-reenviar');

    expect(screen.getByText(MENSAGEM_RECUPERACAO_INDISPONIVEL)).toBeOnTheScreen();
  });
});
