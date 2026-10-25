import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AuthContext } from '../../contexts/AuthContext';
import { PacienteNavigator } from '../../navigation/PacienteNavigator';
import { ProfissionalNavigator } from '../../navigation/ProfissionalNavigator';
import { consultaService } from '../../services/consultaService';
import { meService } from '../../services/meService';
import { mensagemService } from '../../services/mensagemService';
import { pacienteService } from '../../services/pacienteService';
import { authValue, usuarioProfissional } from '../../test/authContextValue';
import { networkError, Providers } from '../../test/helpers';

jest.mock('../../services/consultaService');
jest.mock('../../services/pacienteService');
jest.mock('../../services/mensagemService');
jest.mock('../../services/meService');

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(consultaService.listarTodos).mockResolvedValue([]);
  jest.mocked(pacienteService.listarTodos).mockResolvedValue([]);
  jest.mocked(mensagemService.listarPorPaciente).mockResolvedValue([]);
  jest.mocked(meService.minhaConversa).mockResolvedValue([]);
  jest.mocked(mensagemService.caixaEntrada).mockResolvedValue([
    {
      pacienteId: 42,
      pacienteNome: 'João',
      ultimaMensagem: 'Tudo bem?',
      ultimoAutor: 'PROFISSIONAL',
      dataUltimaMensagem: '2026-10-08T10:00:00',
    },
  ]);
  jest.mocked(meService.minhasConversas).mockResolvedValue([
    {
      profissionalId: 9,
      profissionalNome: 'Dra. Ana',
      ultimaMensagem: 'Estou melhor',
      ultimoAutor: 'PACIENTE',
      dataUltimaMensagem: '2026-10-08T09:00:00',
    },
  ]);
});

async function montar(paciente: boolean) {
  await render(
    <Providers navigation>
      <AuthContext.Provider
        value={authValue({
          user: { ...usuarioProfissional, role: paciente ? 'ROLE_PACIENTE' : 'ROLE_PROFISSIONAL' },
        })}
      >
        {paciente ? <PacienteNavigator /> : <ProfissionalNavigator />}
      </AuthContext.Provider>
    </Providers>,
  );
}

it('profissional busca localmente e abre a conversa com o paciente selecionado', async () => {
  await montar(false);
  await fireEvent.press(screen.getByTestId('tab-mensagens'));
  await screen.findByTestId('conversa-42');
  await fireEvent.changeText(screen.getByTestId('inbox-search'), 'JOAO');
  expect(mensagemService.caixaEntrada).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Você: Tudo bem?')).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId('conversa-42'));
  await waitFor(() => expect(mensagemService.listarPorPaciente).toHaveBeenCalledWith(42));
  expect(await screen.findByTestId('chat-input')).toBeOnTheScreen();
});

it('paciente carrega seu endpoint e abre o profissional correspondente', async () => {
  await montar(true);
  await fireEvent.press(await screen.findByTestId('conversa-9'));
  await waitFor(() => expect(meService.minhaConversa).toHaveBeenCalledWith(9));
  expect(mensagemService.caixaEntrada).not.toHaveBeenCalled();
  expect(await screen.findByTestId('chat-input')).toBeOnTheScreen();
});

it('uma falha de atualização mantém a conversa e a nova tentativa recupera a caixa', async () => {
  await montar(true);
  await screen.findByTestId('conversa-9');
  jest.mocked(meService.minhasConversas).mockRejectedValueOnce(networkError());
  await fireEvent(screen.getByTestId('chat-inbox'), 'refresh');
  expect(await screen.findByTestId('error-state')).toBeOnTheScreen();
  expect(screen.getByTestId('conversa-9')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Tentar novamente'));
  await waitFor(() => expect(screen.queryByTestId('error-state')).toBeNull());
  expect(meService.minhasConversas).toHaveBeenCalledTimes(3);
});
