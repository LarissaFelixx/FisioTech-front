import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { AuthContext, type AuthContextValue } from '../../contexts/AuthContext';
import { ProfissionalNavigator } from '../../navigation/ProfissionalNavigator';
import { consultaService } from '../../services/consultaService';
import { pacienteService } from '../../services/pacienteService';
import { authValue } from '../../test/authContextValue';
import { consulta, networkError, Providers } from '../../test/helpers';
import type { Paciente } from '../../types/paciente';
import { clock } from '../../utils/clock';

jest.mock('../../services/consultaService', () => ({
  consultaService: { listarTodos: jest.fn() },
}));
jest.mock('../../services/pacienteService', () => ({
  pacienteService: { listarTodos: jest.fn(), cadastrarPublico: jest.fn() },
}));

const listarConsultas = jest.mocked(consultaService.listarTodos);
const listarPacientes = jest.mocked(pacienteService.listarTodos);

const pacientes = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i }) as Paciente);

// "Agora" fixo: 29/09/2026 às 10:00.
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(clock, 'agora').mockReturnValue(new Date(2026, 8, 29, 10, 0));
});

async function renderHome(parcial: Partial<AuthContextValue> = {}) {
  const value = authValue(parcial);
  await render(
    <Providers navigation>
      <AuthContext.Provider value={value}>
        <ProfissionalNavigator />
      </AuthContext.Provider>
    </Providers>,
  );
  return value;
}

describe('Home do profissional', () => {
  it('saúda o usuário e mostra skeletons enquanto carrega', async () => {
    listarConsultas.mockReturnValue(new Promise(() => undefined));
    listarPacientes.mockReturnValue(new Promise(() => undefined));

    await renderHome();

    expect(screen.getByRole('button', { name: 'Abrir menu do perfil' })).toBeOnTheScreen();
    expect(screen.getByTestId('home-nome')).toHaveTextContent('Dra. Ana Lima');
    expect(screen.getByTestId('skeleton-lines')).toBeOnTheScreen();
    expect(screen.getByTestId('skeleton-list')).toBeOnTheScreen();
  });

  it('mostra a próxima consulta, os totais e a agenda de hoje', async () => {
    listarConsultas.mockResolvedValue([
      consulta({
        id: 1,
        dataHora: '2026-09-29T08:00:00',
        status: 'REALIZADA',
        pacienteNome: 'Rui Alves',
      }),
      consulta({
        id: 2,
        dataHora: '2026-09-29T10:25:00',
        pacienteNome: 'Maria Souza',
        tipo: 'ONLINE',
        convenio: 'Unimed',
      }),
      consulta({ id: 3, dataHora: '2026-09-29T15:00:00', pacienteNome: 'João Lima' }),
      consulta({ id: 4, dataHora: '2026-09-29T16:00:00', status: 'CANCELADA', pacienteNome: 'Zé' }),
    ]);
    listarPacientes.mockResolvedValue(pacientes(12));

    await renderHome();

    const hero = await screen.findByTestId('home-hero');
    expect(within(hero).getByText('10:25')).toBeOnTheScreen();
    expect(within(hero).getByText('Maria Souza')).toBeOnTheScreen();
    expect(within(hero).getByText('Online · Unimed')).toBeOnTheScreen();
    expect(within(hero).getByText('em 25 min')).toBeOnTheScreen();

    await waitFor(() => expect(screen.getByTestId('stat-pacientes')).toHaveTextContent(/12/));
    expect(screen.getByTestId('stat-sessoes')).toHaveTextContent(/3/);

    const agenda = screen.getByTestId('home-agenda');
    expect(within(agenda).getByText('Rui Alves')).toBeOnTheScreen();
    expect(within(agenda).getByText('João Lima')).toBeOnTheScreen();
    expect(within(agenda).getByText('15:00 · Presencial')).toBeOnTheScreen();
    expect(within(agenda).queryByText('Maria Souza')).not.toBeOnTheScreen();
    expect(within(agenda).queryByText('Zé')).not.toBeOnTheScreen();
  });

  it('estado vazio: sem consultas futuras nem agenda', async () => {
    listarConsultas.mockResolvedValue([]);
    listarPacientes.mockResolvedValue([]);

    await renderHome();

    expect(await screen.findByText('Nenhuma consulta futura agendada.')).toBeOnTheScreen();
    expect(screen.getByText('Nenhuma outra consulta hoje.')).toBeOnTheScreen();
    expect(screen.getByTestId('stat-pacientes')).toHaveTextContent(/0/);
    expect(screen.getByTestId('stat-sessoes')).toHaveTextContent(/0/);
  });

  it('estado de erro com "Tentar novamente" que recarrega os dados', async () => {
    listarConsultas
      .mockRejectedValueOnce(networkError())
      .mockResolvedValue([
        consulta({ id: 9, dataHora: '2026-09-29T11:00:00', pacienteNome: 'Carla Dias' }),
      ]);
    listarPacientes.mockRejectedValueOnce(networkError()).mockResolvedValue(pacientes(2));

    await renderHome();

    expect(await screen.findByText('Não foi possível carregar seus dados.')).toBeOnTheScreen();
    expect(screen.queryByTestId('home-hero')).not.toBeOnTheScreen();
    expect(screen.getByTestId('stat-pacientes')).toHaveTextContent(/–/);

    await fireEvent.press(screen.getByText('Tentar novamente'));

    expect(await screen.findByText('Carla Dias')).toBeOnTheScreen();
    expect(screen.queryByText('Não foi possível carregar seus dados.')).not.toBeOnTheScreen();
  });

  it('"Prontuário" e "Iniciar consulta" abrem as telas da consulta', async () => {
    listarConsultas.mockResolvedValue([consulta({ id: 5, dataHora: '2026-09-29T11:00:00' })]);
    listarPacientes.mockResolvedValue([]);
    await renderHome();

    await fireEvent.press(await screen.findByTestId('home-prontuario'));
    expect(await screen.findByText('O detalhe da consulta chega no Batch 5.')).toBeOnTheScreen();
  });

  it('"ver tudo" leva para a aba Consultas', async () => {
    listarConsultas.mockResolvedValue([]);
    listarPacientes.mockResolvedValue([]);
    await renderHome();

    await fireEvent.press(await screen.findByText('ver tudo'));

    expect(await screen.findByText('A lista de consultas chega no Batch 5.')).toBeOnTheScreen();
  });

  it('a saudação abre o menu com "Sair", que faz logout', async () => {
    listarConsultas.mockResolvedValue([]);
    listarPacientes.mockResolvedValue([]);
    const value = await renderHome();

    await fireEvent.press(screen.getByTestId('home-perfil'));
    await fireEvent.press(await screen.findByTestId('menu-sair'));

    expect(value.logout).toHaveBeenCalledTimes(1);
  });

  it('o menu leva para "Alterar Senha"', async () => {
    listarConsultas.mockResolvedValue([]);
    listarPacientes.mockResolvedValue([]);
    await renderHome();

    await fireEvent.press(screen.getByTestId('home-perfil'));
    await fireEvent.press(await screen.findByText('Alterar Senha'));

    expect(await screen.findByText('A troca de senha chega no Batch 7.')).toBeOnTheScreen();
  });
});
