import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { consulta, httpError, paciente, Providers } from '../../../test/helpers';
import type { ProfissionalBusca } from '../../../types/consultaBooking';
import { clock } from '../../../utils/clock';

jest.mock('../../../services/meService');

const usuario = { ...usuarioProfissional, nome: 'Marcos Coelho', role: 'ROLE_PACIENTE' };

const ana: ProfissionalBusca = {
  id: 1,
  nome: 'Ana Souza',
  especialidade: 'Ortopedia',
  valorConsultaParticular: 180,
  conveniosAceitos: ['Unimed', 'Hapvida'],
};
const bruno: ProfissionalBusca = {
  id: 2,
  nome: 'Bruno Farias',
  especialidade: 'Neurofuncional',
  valorConsultaParticular: null,
  conveniosAceitos: [],
};

const grade = (data: string, ocupados: string[] = []) => ({
  data,
  horarios: ['08:00:00', '09:00:00', '10:00:00', '11:00:00'].map((horario) => ({
    horario,
    disponivel: !ocupados.includes(horario),
  })),
});

beforeEach(() => {
  jest.clearAllMocks();
  // Sexta, 22/08/2025, 08:30: o horário das 08:00 já passou.
  jest.spyOn(clock, 'agora').mockReturnValue(new Date(2025, 7, 22, 8, 30));
  jest.mocked(meService.minhasConsultas).mockResolvedValue([]);
  jest.mocked(meService.minhasConversas).mockResolvedValue([]);
  jest.mocked(meService.perfil).mockResolvedValue(paciente({ profissionalId: 1 }));
  jest.mocked(meService.buscarProfissional).mockResolvedValue(ana);
  jest.mocked(meService.buscarProfissionais).mockResolvedValue([ana, bruno]);
  jest
    .mocked(meService.buscarDisponibilidade)
    .mockImplementation(async (_id, data) => grade(data, ['10:00:00']));
  jest.mocked(meService.marcarConsulta).mockResolvedValue(consulta({ id: 77 }));
});

/** Abre a marcação como o paciente faz: aba Consultas → "Marcar Consulta". */
async function abrirMarcacao() {
  await render(
    <Providers navigation>
      <AuthContext.Provider value={authValue({ user: usuario })}>
        <ConfirmDialogProvider>
          <PacienteNavigator />
        </ConfirmDialogProvider>
      </AuthContext.Provider>
    </Providers>,
  );
  await fireEvent.press(screen.getByTestId('tab-consultas'));
  await fireEvent.press(await screen.findByTestId('consultas-marcar'));
  expect(await screen.findByRole('header', { name: 'Marcar consulta' })).toBeOnTheScreen();
}

const botaoConfirmar = () => screen.getByTestId('marcar-confirmar');

describe('Marcar consulta (#40), paciente com profissional', () => {
  it('vai direto para o profissional dele, com a grade de hoje e o valor particular', async () => {
    await abrirMarcacao();

    expect(await screen.findByText('com Ana Souza · Ortopedia')).toBeOnTheScreen();
    expect(screen.queryByTestId('marcar-trocar-profissional')).toBeNull();
    expect(meService.buscarProfissional).toHaveBeenCalledWith(1);
    expect(meService.buscarDisponibilidade).toHaveBeenCalledWith(1, '2025-08-22');

    expect(await screen.findByTestId('horario-08:00')).toBeDisabled(); // já passou
    expect(screen.getByTestId('horario-10:00')).toBeDisabled(); // ocupado
    expect(screen.getByTestId('horario-09:00')).toBeEnabled();
    expect(screen.getByText('Valor da sessão')).toBeOnTheScreen();
    expect(screen.getByText('R$ 180,00')).toBeOnTheScreen();

    expect(screen.getByText('Escolha um horário')).toBeOnTheScreen();
    expect(botaoConfirmar()).toBeDisabled();
  });

  it('marca particular e presencial depois da confirmação e abre o detalhe da consulta', async () => {
    await abrirMarcacao();

    await fireEvent.press(await screen.findByTestId('horario-09:00'));
    expect(screen.getByText('Confirmar 22 ago, 09:00')).toBeOnTheScreen();
    await fireEvent.press(botaoConfirmar());

    expect(
      screen.getByText('Confirmar consulta com Ana Souza em 22 ago, 09:00?'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));

    await waitFor(() =>
      expect(meService.marcarConsulta).toHaveBeenCalledWith({
        profissionalId: 1,
        dataHora: '2025-08-22T09:00:00',
        tipo: 'PRESENCIAL',
        convenio: null,
      }),
    );
    expect(
      await screen.findByText('O detalhe da consulta chega com a atividade #41.'),
    ).toBeOnTheScreen();
  });

  it('"Não" na confirmação não marca nada', async () => {
    await abrirMarcacao();

    await fireEvent.press(await screen.findByTestId('horario-09:00'));
    await fireEvent.press(botaoConfirmar());
    await fireEvent.press(screen.getByTestId('confirm-cancelar'));

    expect(meService.marcarConsulta).not.toHaveBeenCalled();
    expect(screen.getByRole('header', { name: 'Marcar consulta' })).toBeOnTheScreen();
  });

  it('no convênio exige escolher um dos convênios aceitos; marca online com ele', async () => {
    await abrirMarcacao();

    await fireEvent.press(await screen.findByTestId('horario-11:00'));
    await fireEvent.press(screen.getByTestId('marcar-pagamento-convenio'));
    expect(screen.queryByText('Valor da sessão')).toBeNull();
    expect(botaoConfirmar()).toBeDisabled();

    await fireEvent.press(screen.getByTestId('marcar-convenio-Hapvida'));
    await fireEvent.press(screen.getByTestId('marcar-tipo-ONLINE'));
    expect(botaoConfirmar()).toBeEnabled();

    await fireEvent.press(botaoConfirmar());
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));
    await waitFor(() =>
      expect(meService.marcarConsulta).toHaveBeenCalledWith({
        profissionalId: 1,
        dataHora: '2025-08-22T11:00:00',
        tipo: 'ONLINE',
        convenio: 'Hapvida',
      }),
    );
  });

  it('voltar para particular descarta o convênio escolhido', async () => {
    await abrirMarcacao();

    await fireEvent.press(await screen.findByTestId('horario-09:00'));
    await fireEvent.press(screen.getByTestId('marcar-pagamento-convenio'));
    await fireEvent.press(screen.getByTestId('marcar-convenio-Unimed'));
    await fireEvent.press(screen.getByTestId('marcar-pagamento-particular'));
    await fireEvent.press(screen.getByTestId('marcar-pagamento-convenio'));

    expect(botaoConfirmar()).toBeDisabled();
  });

  it('trocar de dia busca a grade dele e limpa o horário escolhido', async () => {
    await abrirMarcacao();

    await fireEvent.press(await screen.findByTestId('horario-09:00'));
    await fireEvent.press(screen.getByTestId('dia-2025-08-25'));

    await waitFor(() =>
      expect(meService.buscarDisponibilidade).toHaveBeenCalledWith(1, '2025-08-25'),
    );
    expect(screen.getByText('Escolha um horário')).toBeOnTheScreen();
    // Em outro dia, 08:00 não passou.
    expect(await screen.findByTestId('horario-08:00')).toBeEnabled();
  });

  it('dia sem horário livre avisa no lugar da grade', async () => {
    jest
      .mocked(meService.buscarDisponibilidade)
      .mockResolvedValue(grade('2025-08-22', ['09:00:00', '10:00:00', '11:00:00']));
    await abrirMarcacao();

    expect(await screen.findByText('Nenhum horário livre neste dia.')).toBeOnTheScreen();
  });

  it('409: avisa que o horário foi ocupado, limpa a escolha e atualiza a grade', async () => {
    jest.mocked(meService.marcarConsulta).mockRejectedValue(httpError(409));
    await abrirMarcacao();

    await fireEvent.press(await screen.findByTestId('horario-09:00'));
    const buscasAntes = jest.mocked(meService.buscarDisponibilidade).mock.calls.length;
    await fireEvent.press(botaoConfirmar());
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));

    expect(
      await screen.findByText('Este horário não está mais disponível. Escolha outro.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Escolha um horário')).toBeOnTheScreen();
    await waitFor(() =>
      expect(meService.buscarDisponibilidade).toHaveBeenCalledTimes(buscasAntes + 1),
    );
  });

  it('outros erros mantêm a escolha e mostram a mensagem genérica', async () => {
    jest.mocked(meService.marcarConsulta).mockRejectedValue(httpError(500));
    await abrirMarcacao();

    await fireEvent.press(await screen.findByTestId('horario-09:00'));
    await fireEvent.press(botaoConfirmar());
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));

    expect(
      await screen.findByText('Não foi possível marcar a consulta. Tente novamente.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Confirmar 22 ago, 09:00')).toBeOnTheScreen();
  });

  it('"Voltar" retorna a Minhas Consultas', async () => {
    await abrirMarcacao();

    await fireEvent.press(screen.getByTestId('voltar'));
    expect(await screen.findByTestId('consultas-marcar')).toBeOnTheScreen();
  });

  it('erro ao carregar o perfil mostra "Tentar novamente"', async () => {
    jest.mocked(meService.perfil).mockRejectedValueOnce(httpError(500));
    await render(
      <Providers navigation>
        <AuthContext.Provider value={authValue({ user: usuario })}>
          <ConfirmDialogProvider>
            <PacienteNavigator />
          </ConfirmDialogProvider>
        </AuthContext.Provider>
      </Providers>,
    );
    await fireEvent.press(screen.getByTestId('tab-consultas'));
    await fireEvent.press(await screen.findByTestId('consultas-marcar'));

    expect(
      await screen.findByText('Não foi possível carregar os dados para marcar a consulta.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByText('com Ana Souza · Ortopedia')).toBeOnTheScreen();
  });
});

describe('Marcar consulta (#40), paciente sem profissional', () => {
  beforeEach(() => {
    jest.mocked(meService.perfil).mockResolvedValue(paciente({ profissionalId: null }));
  });

  it('escolhe o profissional na lista (com busca local) e pode trocar depois', async () => {
    await abrirMarcacao();

    expect(await screen.findByText('Escolha o profissional')).toBeOnTheScreen();
    expect(screen.getByTestId('marcar-profissional-1')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByTestId('marcar-busca'), 'neuro');
    expect(screen.queryByTestId('marcar-profissional-1')).toBeNull();

    await fireEvent.press(screen.getByTestId('marcar-profissional-2'));
    expect(await screen.findByText('com Bruno Farias · Neurofuncional')).toBeOnTheScreen();
    expect(meService.buscarDisponibilidade).toHaveBeenCalledWith(2, '2025-08-22');
    expect(meService.buscarProfissional).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('marcar-trocar-profissional'));
    expect(await screen.findByText('Escolha o profissional')).toBeOnTheScreen();
  });

  it('avisa quando o profissional não tem valor particular nem convênios', async () => {
    await abrirMarcacao();

    await fireEvent.press(await screen.findByTestId('marcar-profissional-2'));
    expect(
      await screen.findByText('Este profissional ainda não definiu um valor particular.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('marcar-pagamento-convenio'));
    expect(screen.getByText('Este profissional não tem convênios cadastrados.')).toBeOnTheScreen();
  });

  it('busca sem resultado avisa', async () => {
    await abrirMarcacao();

    await fireEvent.changeText(await screen.findByTestId('marcar-busca'), 'xyz');
    expect(screen.getByText('Nenhum profissional encontrado.')).toBeOnTheScreen();
  });
});
