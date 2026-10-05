import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AuthContext } from '../../contexts/AuthContext';
import { PacienteNavigator } from '../../navigation/PacienteNavigator';
import { ProfissionalNavigator } from '../../navigation/ProfissionalNavigator';
import { consultaService } from '../../services/consultaService';
import { meService } from '../../services/meService';
import { mensagemService } from '../../services/mensagemService';
import { pacienteService } from '../../services/pacienteService';
import { authValue, usuarioProfissional } from '../../test/authContextValue';
import { httpError, Providers } from '../../test/helpers';
import type { Mensagem } from '../../types/mensagem';

jest.mock('../../services/consultaService');
jest.mock('../../services/pacienteService');
jest.mock('../../services/mensagemService');
jest.mock('../../services/meService');

const recebida: Mensagem = {
  id: 1,
  pacienteId: 42,
  profissionalId: 1,
  autor: 'PACIENTE',
  conteudo: 'Estou melhor',
  dataEnvio: '2026-10-05T10:00:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(consultaService.listarTodos).mockResolvedValue([]);
  jest.mocked(pacienteService.listarTodos).mockResolvedValue([]);
  jest.mocked(mensagemService.caixaEntrada).mockResolvedValue([
    {
      pacienteId: 42,
      pacienteNome: 'Maria',
      ultimaMensagem: recebida.conteudo,
      ultimoAutor: 'PACIENTE',
      dataUltimaMensagem: recebida.dataEnvio,
    },
  ]);
  jest.mocked(mensagemService.listarPorPaciente).mockResolvedValue([recebida]);
  jest.mocked(mensagemService.enviar).mockResolvedValue(undefined);
  jest.mocked(meService.minhasConversas).mockResolvedValue([
    {
      profissionalId: 1,
      profissionalNome: 'Dra. Ana',
      ultimaMensagem: recebida.conteudo,
      ultimoAutor: 'PACIENTE',
      dataUltimaMensagem: recebida.dataEnvio,
    },
  ]);
  jest.mocked(meService.minhaConversa).mockResolvedValue([recebida]);
  jest.mocked(meService.enviarMensagem).mockResolvedValue(undefined);
});

async function montar(paciente: boolean) {
  return render(
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

it('profissional abre a caixa, envia com o paciente correto e atualiza o histórico', async () => {
  await montar(false);
  await fireEvent.press(screen.getByTestId('tab-mensagens'));
  await fireEvent.press(await screen.findByTestId('conversa-42'));
  expect(await screen.findByTestId('mensagem-1')).toHaveProp(
    'accessibilityLabel',
    'Recebida, 10:00: Estou melhor',
  );
  await fireEvent.changeText(screen.getByTestId('chat-input'), 'Ótimo, Maria!');
  await fireEvent.press(screen.getByTestId('chat-send'));
  await waitFor(() =>
    expect(mensagemService.enviar).toHaveBeenCalledWith({
      pacienteId: 42,
      autor: 'PROFISSIONAL',
      conteudo: 'Ótimo, Maria!',
    }),
  );
  await waitFor(() => expect(mensagemService.listarPorPaciente).toHaveBeenCalledTimes(2));
  expect(screen.getByTestId('chat-input')).toHaveProp('value', '');
});

it('paciente usa a rota /me com o profissional escolhido e reconhece suas mensagens', async () => {
  await montar(true);
  await fireEvent.press(await screen.findByTestId('conversa-1'));
  expect(await screen.findByTestId('mensagem-1')).toHaveProp(
    'accessibilityLabel',
    'Você, 10:00: Estou melhor',
  );
  await fireEvent.changeText(screen.getByTestId('chat-input'), 'Obrigada!');
  await fireEvent.press(screen.getByTestId('chat-send'));
  await waitFor(() => expect(meService.enviarMensagem).toHaveBeenCalledWith(1, 'Obrigada!'));
  await waitFor(() => expect(meService.minhaConversa).toHaveBeenCalledTimes(2));
  expect(mensagemService.enviar).not.toHaveBeenCalled();
});

it('acesso negado mostra a orientação e desabilita o envio', async () => {
  jest.mocked(meService.minhaConversa).mockRejectedValue(httpError(403));
  await montar(true);
  await fireEvent.press(await screen.findByTestId('conversa-1'));
  expect(await screen.findByText('Você não tem acesso a esta conversa.')).toBeOnTheScreen();
  expect(screen.getByTestId('chat-input')).toHaveProp('editable', false);
  expect(screen.getByTestId('chat-send')).toBeDisabled();
});
