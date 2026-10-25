import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { consulta, httpError, Providers } from '../../../test/helpers';

jest.mock('../../../services/meService');

const realizada = consulta({
  id: 8,
  profissionalNome: 'Ana Souza',
  dataHora: '2025-08-15T15:00:00',
  status: 'REALIZADA',
  convenio: 'Unimed',
  diagnostico: {
    planoTratamento: 'Fortalecimento de manguito rotador.',
    objetivosTratamento: null,
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(meService.minhasConversas).mockResolvedValue([]);
  jest.mocked(meService.minhasConsultas).mockResolvedValue([realizada]);
  jest.mocked(meService.minhaConsulta).mockResolvedValue(realizada);
  jest.mocked(meService.minhaAvaliacao).mockRejectedValue(httpError(404));
});

async function abrir() {
  await render(
    <Providers navigation>
      <AuthContext.Provider
        value={authValue({ user: { ...usuarioProfissional, role: 'ROLE_PACIENTE' } })}
      >
        <ConfirmDialogProvider>
          <PacienteNavigator />
        </ConfirmDialogProvider>
      </AuthContext.Provider>
    </Providers>,
  );
  await fireEvent.press(screen.getByTestId('tab-consultas'));
  await fireEvent.press(await screen.findByTestId('minha-consulta-8'));
  await screen.findByTestId('consulta-paciente');
}

describe('Consulta Realizada (#42)', () => {
  it('ainda não avaliada (404): convida a avaliar, sem remarcar nem cancelar', async () => {
    await abrir();
    expect(screen.getByText('Realizada')).toBeOnTheScreen();
    expect(await screen.findByTestId('consulta-convite-avaliar')).toBeOnTheScreen();
    expect(screen.getByText('Como foi seu atendimento?')).toBeOnTheScreen();
    expect(screen.getByText('Sua avaliação ajuda a clínica a melhorar')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-remarcar')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-cancelar')).not.toBeOnTheScreen();
    expect(meService.minhaAvaliacao).toHaveBeenCalledWith(8);
  });

  it('"Avaliar consulta" abre a avaliação', async () => {
    await abrir();
    await fireEvent.press(await screen.findByTestId('consulta-avaliar'));
    expect(await screen.findByRole('header', { name: 'Avaliar atendimento' })).toBeOnTheScreen();
  });

  it('já avaliada: mostra as estrelas e o comentário no lugar do convite', async () => {
    jest.mocked(meService.minhaAvaliacao).mockResolvedValue({
      id: 1,
      consultaId: 8,
      nota: 4,
      comentario: 'Ótimo atendimento',
      dataCriacao: '2025-08-16T10:00:00',
    });
    await abrir();
    const avaliacao = await screen.findByTestId('consulta-minha-avaliacao');
    expect(within(avaliacao).getByText('★★★★☆')).toBeOnTheScreen();
    expect(within(avaliacao).getByText('4 de 5')).toBeOnTheScreen();
    expect(within(avaliacao).getByText('Ótimo atendimento')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-convite-avaliar')).not.toBeOnTheScreen();
  });

  it('erro ao buscar a avaliação (não 404) tem "Tentar novamente"', async () => {
    jest.mocked(meService.minhaAvaliacao).mockRejectedValue(httpError(500));
    await abrir();
    expect(await screen.findByText('Não foi possível carregar sua avaliação.')).toBeOnTheScreen();
    jest.mocked(meService.minhaAvaliacao).mockRejectedValue(httpError(404));
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('consulta-convite-avaliar')).toBeOnTheScreen();
  });

  it('consulta não realizada nem busca avaliação', async () => {
    jest
      .mocked(meService.minhasConsultas)
      .mockResolvedValue([{ ...realizada, status: 'AGENDADA' }]);
    jest.mocked(meService.minhaConsulta).mockResolvedValue({ ...realizada, status: 'AGENDADA' });
    await abrir();
    expect(screen.getByTestId('consulta-remarcar')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-convite-avaliar')).not.toBeOnTheScreen();
    expect(meService.minhaAvaliacao).not.toHaveBeenCalled();
  });
});
