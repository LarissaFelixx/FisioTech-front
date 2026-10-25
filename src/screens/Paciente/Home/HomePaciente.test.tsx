import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { consulta, httpError, paciente as pacienteMe, Providers } from '../../../test/helpers';
import { clock } from '../../../utils/clock';

jest.mock('../../../services/meService');

const paciente = { ...usuarioProfissional, nome: 'Marcos Coelho', role: 'ROLE_PACIENTE' };

const proxima = consulta({
  id: 7,
  dataHora: '2025-08-22T09:00:00',
  status: 'CONFIRMADA',
  profissionalNome: 'Ana Souza',
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(clock, 'agora').mockReturnValue(new Date(2025, 7, 20, 10, 0));
  jest
    .mocked(meService.minhasConsultas)
    .mockResolvedValue([
      proxima,
      consulta({ dataHora: '2025-08-15T15:00:00', status: 'REALIZADA' }),
      consulta({ dataHora: '2025-08-01T10:00:00', status: 'REALIZADA' }),
      consulta({ dataHora: '2025-07-20T08:00:00', status: 'CANCELADA' }),
    ]);
  jest.mocked(meService.minhasConversas).mockResolvedValue([]);
  jest.mocked(meService.perfil).mockResolvedValue(pacienteMe());
  jest.mocked(meService.buscarProfissionais).mockResolvedValue([]);
});

async function montar() {
  const value = authValue({ user: paciente });
  await render(
    <Providers navigation>
      <AuthContext.Provider value={value}>
        <PacienteNavigator />
      </AuthContext.Provider>
    </Providers>,
  );
  return value;
}

describe('Home do paciente (#38)', () => {
  it('saúda pelo nome e mostra a próxima consulta e o resumo das consultas', async () => {
    await montar();

    expect(screen.getByText('Bem-vindo,')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Marcos Coelho' })).toBeOnTheScreen();

    expect(await screen.findByTestId('home-proxima-consulta')).toBeOnTheScreen();
    expect(screen.getByText('Sua próxima consulta')).toBeOnTheScreen();
    expect(screen.getByText('22')).toBeOnTheScreen();
    expect(screen.getByText('ago · 09:00')).toBeOnTheScreen();
    expect(screen.getByText('Ana Souza · Presencial')).toBeOnTheScreen();
    expect(screen.getByText('4 consultas · 1 agendada')).toBeOnTheScreen();
    expect(screen.queryByTestId('home-marcar-primeira')).toBeNull();
  });

  it.each(['home-ver-detalhes', 'home-remarcar'])(
    '"%s" abre o detalhe da próxima consulta',
    async (testID) => {
      await montar();

      await fireEvent.press(await screen.findByTestId(testID));
      expect(
        await screen.findByText('O detalhe da consulta chega com a atividade #41.'),
      ).toBeOnTheScreen();
    },
  );

  it('sem consulta futura em aberto, não mostra o destaque', async () => {
    jest
      .mocked(meService.minhasConsultas)
      .mockResolvedValue([consulta({ dataHora: '2025-08-15T15:00:00', status: 'REALIZADA' })]);
    await montar();

    expect(await screen.findByText('1 consulta · 0 agendadas')).toBeOnTheScreen();
    expect(screen.queryByTestId('home-proxima-consulta')).toBeNull();
  });

  it('sem nenhuma consulta, convida a marcar a primeira', async () => {
    jest.mocked(meService.minhasConsultas).mockResolvedValue([]);
    await montar();

    await fireEvent.press(await screen.findByTestId('home-marcar-primeira'));
    expect(await screen.findByRole('header', { name: 'Marcar consulta' })).toBeOnTheScreen();
  });

  it('se as consultas falham, o atalho continua lá com "Ver consultas"', async () => {
    jest.mocked(meService.minhasConsultas).mockRejectedValue(httpError(500));
    await montar();

    expect(await screen.findByText('Ver consultas')).toBeOnTheScreen();
    expect(screen.queryByTestId('home-proxima-consulta')).toBeNull();
  });

  it('marca "Mensagens" quando o profissional foi o último a escrever', async () => {
    jest.mocked(meService.minhasConversas).mockResolvedValue([
      {
        profissionalId: 1,
        profissionalNome: 'Ana Souza',
        ultimaMensagem: 'Bom dia',
        ultimoAutor: 'PROFISSIONAL',
        dataUltimaMensagem: '2025-08-20T09:00:00',
      },
    ]);
    await montar();

    expect(await screen.findByTestId('home-mensagens-novas')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Mensagens, novas mensagens' })).toBeOnTheScreen();
  });

  it('sem mensagem nova, "Mensagens" não tem o ponto', async () => {
    await montar();

    await waitFor(() => expect(meService.minhasConversas).toHaveBeenCalled());
    expect(screen.queryByTestId('home-mensagens-novas')).toBeNull();
  });

  it('os atalhos levam às abas e ao tratamento', async () => {
    await montar();

    await fireEvent.press(screen.getByTestId('home-minhas-consultas'));
    expect(await screen.findByRole('header', { name: 'Minhas Consultas' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('tab-home'));
    await fireEvent.press(screen.getByTestId('home-mensagens'));
    expect(await screen.findByTestId('chat-inbox')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('tab-home'));
    await fireEvent.press(screen.getByTestId('home-meu-perfil'));
    expect(await screen.findByText('O seu perfil chega com a atividade #44.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('tab-home'));
    await fireEvent.press(screen.getByTestId('home-meu-tratamento'));
    expect(
      await screen.findByText('O seu tratamento chega com a atividade #47.'),
    ).toBeOnTheScreen();
  });

  it('o avatar abre o menu, que encerra a sessão em "Sair"', async () => {
    const value = await montar();

    expect(screen.queryByTestId('menu-lateral')).toBeNull();
    await fireEvent.press(screen.getByTestId('paciente-avatar'));
    expect(screen.getByTestId('menu-lateral')).toBeOnTheScreen();
    expect(screen.getByText('Paciente')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('menu-sair'));
    expect(value.logout).toHaveBeenCalled();
  });
});
