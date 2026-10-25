import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { httpError, networkError, Providers } from '../../../test/helpers';
import { MENSAGEM_SENHAS_DIFERENTES, mensagemErroSenha, validarSenha } from './senhaLogic';

jest.mock('../../../services/meService');

const paciente = {
  ...usuarioProfissional,
  nome: 'Marcos Coelho',
  email: 'marcos@x.com',
  role: 'ROLE_PACIENTE',
};

describe('senhaLogic', () => {
  it('exige os três campos, nova senha com 8+ e confirmação igual', () => {
    expect(validarSenha({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' })).toEqual({
      senhaAtual: 'Este campo é obrigatório.',
      novaSenha: 'Este campo é obrigatório.',
      confirmarNovaSenha: 'Este campo é obrigatório.',
    });
    expect(
      validarSenha({ senhaAtual: 'a', novaSenha: '1234567', confirmarNovaSenha: '1234567' }),
    ).toEqual({ novaSenha: expect.stringContaining('8') });
    expect(
      validarSenha({ senhaAtual: 'a', novaSenha: '12345678', confirmarNovaSenha: '12345679' }),
    ).toEqual({ confirmarNovaSenha: MENSAGEM_SENHAS_DIFERENTES });
    expect(
      validarSenha({ senhaAtual: 'a', novaSenha: '12345678', confirmarNovaSenha: '12345678' }),
    ).toEqual({});
  });

  it('400 é senha atual incorreta; o resto, a mensagem genérica do Angular', () => {
    expect(mensagemErroSenha(httpError(400))).toBe('Senha atual incorreta.');
    expect(mensagemErroSenha(httpError(500))).toBe(
      'Não foi possível alterar a senha. Tente novamente.',
    );
  });
});

describe('Alterar Senha (tela)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(meService.minhasConversas).mockResolvedValue([]);
    jest.mocked(meService.alterarSenha).mockResolvedValue(undefined);
  });

  async function abrir(parcial: Parameters<typeof authValue>[0] = {}) {
    const value = authValue({ user: paciente, ...parcial });
    await render(
      <Providers navigation>
        <AuthContext.Provider value={value}>
          <PacienteNavigator />
        </AuthContext.Provider>
      </Providers>,
    );
    await fireEvent.press(await screen.findByTestId('paciente-avatar'));
    await fireEvent.press(screen.getByTestId('menu-alterar-senha'));
    await screen.findByRole('header', { name: 'Alterar Senha' });
    return value;
  }

  async function preencher(atual: string, nova: string, confirmacao = nova) {
    await fireEvent.changeText(screen.getByTestId('senha-senhaAtual'), atual);
    await fireEvent.changeText(screen.getByTestId('senha-novaSenha'), nova);
    await fireEvent.changeText(screen.getByTestId('senha-confirmarNovaSenha'), confirmacao);
    await fireEvent.press(screen.getByTestId('senha-enviar'));
  }

  it('campos de senha são mascarados', async () => {
    await abrir();
    for (const id of ['senha-senhaAtual', 'senha-novaSenha', 'senha-confirmarNovaSenha']) {
      expect(screen.getByTestId(id)).toHaveProp('secureTextEntry', true);
    }
  });

  it('troca a senha, entra de novo com a nova senha e limpa o formulário', async () => {
    const value = await abrir();
    await preencher('senha-velha', 'senha-nova-123');

    await waitFor(() =>
      expect(meService.alterarSenha).toHaveBeenCalledWith({
        senhaAtual: 'senha-velha',
        novaSenha: 'senha-nova-123',
      }),
    );
    expect(await screen.findByTestId('senha-sucesso')).toHaveTextContent(
      'Senha alterada com sucesso.',
    );
    expect(value.login).toHaveBeenCalledWith('marcos@x.com', 'senha-nova-123');
    expect(screen.getByTestId('senha-senhaAtual')).toHaveDisplayValue('');
  });

  it('se o novo login falhar, desloga', async () => {
    const value = await abrir({
      login: jest.fn(async () => {
        throw networkError();
      }),
    });
    await preencher('senha-velha', 'senha-nova-123');
    await waitFor(() => expect(value.logout).toHaveBeenCalled());
    expect(screen.queryByTestId('senha-sucesso')).not.toBeOnTheScreen();
  });

  it('confirmação diferente não chama o backend', async () => {
    await abrir();
    await preencher('senha-velha', 'senha-nova-123', 'outra-senha-123');
    expect(screen.getByText(MENSAGEM_SENHAS_DIFERENTES)).toBeOnTheScreen();
    expect(meService.alterarSenha).not.toHaveBeenCalled();
  });

  it('senha atual incorreta (400)', async () => {
    jest.mocked(meService.alterarSenha).mockRejectedValue(httpError(400));
    const value = await abrir();
    await preencher('errada', 'senha-nova-123');
    expect(await screen.findByTestId('senha-erro')).toHaveTextContent('Senha atual incorreta.');
    expect(value.login).not.toHaveBeenCalled();
  });

  it('"‹ Home" volta para a tela anterior', async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId('voltar'));
    expect(await screen.findByText('Bem-vindo,')).toBeOnTheScreen();
  });
});
