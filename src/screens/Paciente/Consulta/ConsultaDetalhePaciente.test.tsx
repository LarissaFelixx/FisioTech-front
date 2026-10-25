import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { consulta, httpError, Providers } from '../../../test/helpers';
import type { Consulta } from '../../../types/consulta';
import { clock } from '../../../utils/clock';
import {
  mensagemErroRemarcar,
  metaConsulta,
  novaDataHora,
  podeAlterar,
  proximosDias,
  rotuloConfirmar,
  secoesClinicas,
  slotEscolhivel,
} from './consultaPacienteLogic';

jest.mock('../../../services/meService');

// Quinta-feira, 21/08/2025, 10:15.
const AGORA = new Date(2025, 7, 21, 10, 15);

const confirmada = consulta({
  id: 7,
  profissionalId: 3,
  profissionalNome: 'Ana Souza',
  dataHora: '2025-08-22T09:00:00',
  status: 'CONFIRMADA',
  convenio: 'Unimed',
  valor: 180,
  quadroClinico: {
    ...consulta().quadroClinico,
    queixaPrincipal: 'Dor no ombro direito ao elevar o braço.',
  },
  diagnostico: {
    planoTratamento: 'Fortalecimento de manguito rotador, 2x/semana.',
    objetivosTratamento: null,
  },
});

const grade = (data: string) => ({
  data,
  horarios: ['08:00:00', '09:00:00', '10:00:00', '11:00:00'].map((horario) => ({
    horario,
    disponivel: horario !== '10:00:00',
  })),
});

describe('consultaPacienteLogic', () => {
  it('só agendada ou confirmada pode ser remarcada ou cancelada', () => {
    expect(podeAlterar(consulta({ status: 'AGENDADA' }))).toBe(true);
    expect(podeAlterar(consulta({ status: 'CONFIRMADA' }))).toBe(true);
    expect(podeAlterar(consulta({ status: 'REALIZADA' }))).toBe(false);
    expect(podeAlterar(consulta({ status: 'CANCELADA' }))).toBe(false);
  });

  it('meta: data, hora, modalidade e convênio', () => {
    expect(metaConsulta(confirmada)).toEqual({
      data: '22/08/2025',
      hora: '09:00',
      modalidade: 'Presencial',
      convenio: 'Unimed',
    });
    expect(metaConsulta(consulta({ tipo: 'ONLINE' })).modalidade).toBe('Online');
  });

  it('seções clínicas: só as que têm dado, com os campos que o Angular mostrava ao paciente', () => {
    expect(secoesClinicas(confirmada)).toEqual([
      {
        titulo: 'Quadro Clínico',
        linhas: [{ rotulo: 'Queixa principal', valor: 'Dor no ombro direito ao elevar o braço.' }],
      },
      {
        titulo: 'Diagnóstico',
        linhas: [
          {
            rotulo: 'Plano de tratamento',
            valor: 'Fortalecimento de manguito rotador, 2x/semana.',
          },
        ],
      },
    ]);
    expect(secoesClinicas(consulta())).toEqual([]);
  });

  it('faixa de dias começa hoje, com dia da semana e número', () => {
    const dias = proximosDias(AGORA, 3);
    expect(dias).toEqual([
      { iso: '2025-08-21', semana: 'QUI', dia: '21' },
      { iso: '2025-08-22', semana: 'SEX', dia: '22' },
      { iso: '2025-08-23', semana: 'SÁB', dia: '23' },
    ]);
    expect(proximosDias(new Date(2025, 11, 31), 2)[1].iso).toBe('2026-01-01');
  });

  it('horário ocupado ou já passado hoje não é escolhível', () => {
    expect(slotEscolhivel({ horario: '11:00:00', disponivel: true }, '2025-08-21', AGORA)).toBe(
      true,
    );
    expect(slotEscolhivel({ horario: '09:00:00', disponivel: true }, '2025-08-21', AGORA)).toBe(
      false,
    );
    expect(slotEscolhivel({ horario: '11:00:00', disponivel: false }, '2025-08-21', AGORA)).toBe(
      false,
    );
    expect(slotEscolhivel({ horario: '08:00:00', disponivel: true }, '2025-08-22', AGORA)).toBe(
      true,
    );
  });

  it('nova data/hora e rótulo do botão', () => {
    expect(novaDataHora('2025-08-22', '09:00:00')).toBe('2025-08-22T09:00:00');
    expect(rotuloConfirmar('2025-08-22', '09:00:00')).toBe('Confirmar 22 ago, 09:00');
    expect(mensagemErroRemarcar(httpError(409))).toBe(
      'Este horário não está mais disponível. Escolha outro.',
    );
    expect(mensagemErroRemarcar(httpError(400))).toBe('Não foi possível remarcar a consulta.');
  });
});

describe('Consulta Detalhe do Paciente (tela)', () => {
  let noBackend: Consulta;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(clock, 'agora').mockReturnValue(AGORA);
    noBackend = confirmada;
    jest.mocked(meService.minhasConversas).mockResolvedValue([]);
    jest.mocked(meService.minhasConsultas).mockImplementation(async () => [noBackend]);
    jest.mocked(meService.minhaConsulta).mockImplementation(async () => noBackend);
    jest.mocked(meService.cancelarConsulta).mockImplementation(async () => {
      noBackend = { ...noBackend, status: 'CANCELADA' };
    });
    jest
      .mocked(meService.buscarDisponibilidade)
      .mockImplementation(async (_id, data) => grade(data));
    jest.mocked(meService.remarcarConsulta).mockImplementation(async (_id, dataHora) => {
      noBackend = { ...noBackend, dataHora };
      return noBackend;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  async function abrirDetalhe() {
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
    await fireEvent.press(await screen.findByTestId('minha-consulta-7'));
    await screen.findByTestId('consulta-paciente');
  }

  it('mostra status, dados, valor e as seções do Figma', async () => {
    await abrirDetalhe();
    expect(screen.getByText('Confirmada')).toBeOnTheScreen();
    expect(screen.getByText('22/08/2025')).toBeOnTheScreen();
    expect(screen.getByText('09:00')).toBeOnTheScreen();
    expect(screen.getByText('Presencial')).toBeOnTheScreen();
    expect(screen.getByText('Unimed')).toBeOnTheScreen();
    expect(screen.getByTestId('consulta-paciente-valor')).toHaveTextContent('R$ 180,00');
    expect(
      within(screen.getByTestId('secao-Quadro Clínico')).getByText(/Dor no ombro direito/),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('secao-Diagnóstico')).toBeOnTheScreen();
    expect(screen.queryByTestId('secao-Exame Físico')).not.toBeOnTheScreen();
  });

  it('cancelar pede confirmação, cancela e some com as ações', async () => {
    await abrirDetalhe();
    await fireEvent.press(screen.getByTestId('consulta-cancelar'));
    expect(
      screen.getByText('Cancelar esta consulta? Essa ação não pode ser desfeita.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));

    await waitFor(() => expect(meService.cancelarConsulta).toHaveBeenCalledWith(7));
    expect(await screen.findByText('Cancelada')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-cancelar')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-remarcar')).not.toBeOnTheScreen();
  });

  it('"Voltar" no diálogo não cancela', async () => {
    await abrirDetalhe();
    await fireEvent.press(screen.getByTestId('consulta-cancelar'));
    await fireEvent.press(screen.getByTestId('confirm-cancelar'));
    expect(meService.cancelarConsulta).not.toHaveBeenCalled();
  });

  it('erro ao cancelar fica na tela', async () => {
    jest.mocked(meService.cancelarConsulta).mockRejectedValue(httpError(500));
    await abrirDetalhe();
    await fireEvent.press(screen.getByTestId('consulta-cancelar'));
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));
    expect(await screen.findByTestId('consulta-paciente-erro')).toHaveTextContent(
      'Não foi possível cancelar a consulta.',
    );
  });

  it('remarcar: escolhe dia e horário livre e confirma', async () => {
    await abrirDetalhe();
    await fireEvent.press(screen.getByTestId('consulta-remarcar'));
    await waitFor(() =>
      expect(meService.buscarDisponibilidade).toHaveBeenCalledWith(3, '2025-08-21'),
    );
    // Hoje às 10:15: 08:00 e 09:00 já passaram; 10:00 está ocupado.
    expect(await screen.findByTestId('horario-08:00')).toBeDisabled();
    expect(screen.getByTestId('horario-10:00')).toBeDisabled();
    expect(screen.getByTestId('horario-11:00')).toBeEnabled();
    expect(screen.getByTestId('consulta-remarcar-confirmar')).toBeDisabled();

    await fireEvent.press(screen.getByTestId('dia-2025-08-25'));
    await waitFor(() =>
      expect(meService.buscarDisponibilidade).toHaveBeenCalledWith(3, '2025-08-25'),
    );
    await fireEvent.press(await screen.findByTestId('horario-09:00'));
    expect(screen.getByText('Confirmar 25 ago, 09:00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('consulta-remarcar-confirmar'));

    await waitFor(() =>
      expect(meService.remarcarConsulta).toHaveBeenCalledWith(7, '2025-08-25T09:00:00'),
    );
    expect(await screen.findByText('25/08/2025')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-remarcar-painel')).not.toBeOnTheScreen();
  });

  it('horário tomado nesse meio-tempo (409): avisa e recarrega a grade', async () => {
    jest.mocked(meService.remarcarConsulta).mockRejectedValue(httpError(409));
    await abrirDetalhe();
    await fireEvent.press(screen.getByTestId('consulta-remarcar'));
    await fireEvent.press(await screen.findByTestId('horario-11:00'));
    await fireEvent.press(screen.getByTestId('consulta-remarcar-confirmar'));

    expect(await screen.findByTestId('consulta-paciente-erro')).toHaveTextContent(
      'Este horário não está mais disponível. Escolha outro.',
    );
    await waitFor(() => expect(meService.buscarDisponibilidade).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('consulta-remarcar-painel')).toBeOnTheScreen();
  });

  it('consulta cancelada: sem remarcar nem cancelar', async () => {
    noBackend = { ...confirmada, status: 'CANCELADA' };
    await abrirDetalhe();
    expect(screen.getByText('Cancelada')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-remarcar')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-cancelar')).not.toBeOnTheScreen();
  });

  it('erro ao carregar, com "Tentar novamente"', async () => {
    jest.mocked(meService.minhaConsulta).mockRejectedValue(httpError(500));
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
    await fireEvent.press(await screen.findByTestId('minha-consulta-7'));
    expect(await screen.findByText('Não foi possível carregar a consulta.')).toBeOnTheScreen();

    jest.mocked(meService.minhaConsulta).mockResolvedValue(confirmada);
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('consulta-paciente')).toBeOnTheScreen();
  });

  it('"‹ Minhas Consultas" volta para a lista', async () => {
    await abrirDetalhe();
    await fireEvent.press(screen.getByTestId('voltar'));
    expect(await screen.findByRole('header', { name: 'Minhas Consultas' })).toBeOnTheScreen();
  });
});
