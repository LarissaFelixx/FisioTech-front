import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { httpError, Providers } from '../../../test/helpers';
import { AlterarSenhaPacienteScreen } from './AlterarSenhaPacienteScreen';

jest.mock('../../../services/meService');

const service = jest.mocked(meService);

beforeEach(() => {
  jest.clearAllMocks();
  service.minhasConversas.mockResolvedValue([]);
  service.alterarSenha.mockReset().mockResolvedValue(undefined);
});

async function abrirSenha() {
  const auth = authValue({ user: { ...usuarioProfissional, role: 'ROLE_PACIENTE' } });
  await render(
    <Providers>
      <AuthContext.Provider value={auth}>
        <NavigationContainer>
          <PacienteNavigator />
        </NavigationContainer>
      </AuthContext.Provider>
    </Providers>,
  );
  await fireEvent.press(screen.getByTestId('paciente-abrir-senha'));
  return auth;
}

async function preencher(confirmacao = 'senha-nova-123') {
  await fireEvent.changeText(screen.getByTestId('paciente-senha-senhaAtual'), 'senha-atual');
  await fireEvent.changeText(screen.getByTestId('paciente-senha-novaSenha'), 'senha-nova-123');
  await fireEvent.changeText(screen.getByTestId('paciente-senha-confirmacao'), confirmacao);
  await fireEvent.press(screen.getByTestId('paciente-senha-salvar'));
}

it('bloqueia montagem direta para outro perfil antes de montar o formulário', async () => {
  await render(
    <AuthContext.Provider value={authValue()}>
      <AlterarSenhaPacienteScreen />
    </AuthContext.Provider>,
  );
  expect(screen.getByText('Acesso exclusivo para pacientes.')).toBeOnTheScreen();
  expect(service.alterarSenha).not.toHaveBeenCalled();
});

it('exige confirmação idêntica antes de enviar', async () => {
  await abrirSenha();
  await preencher('senha-diferente');
  expect(screen.getByText('As senhas devem ser iguais.')).toBeOnTheScreen();
  expect(service.alterarSenha).not.toHaveBeenCalled();
});

it('envia a alteração da própria senha e renova a sessão', async () => {
  const auth = await abrirSenha();
  await preencher();
  expect(await screen.findByText('Senha alterada com sucesso.')).toBeOnTheScreen();
  expect(service.alterarSenha).toHaveBeenCalledWith({
    senhaAtual: 'senha-atual',
    novaSenha: 'senha-nova-123',
  });
  expect(auth.login).toHaveBeenCalledWith(usuarioProfissional.email, 'senha-nova-123');
  expect(screen.getByTestId('paciente-senha-novaSenha')).toHaveProp('value', '');
});

it('exibe erro de validação do servidor sem renovar a sessão', async () => {
  service.alterarSenha.mockRejectedValueOnce(httpError(400));
  const auth = await abrirSenha();
  await preencher();
  expect(
    await screen.findByText('Confira a senha atual e os requisitos da nova senha.'),
  ).toBeOnTheScreen();
  expect(auth.login).not.toHaveBeenCalled();
});
