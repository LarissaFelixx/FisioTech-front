import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../contexts/AuthContext';
import { ProfissionalNavigator } from '../../navigation/ProfissionalNavigator';
import { avaliacaoService } from '../../services/avaliacaoService';
import { consultaService } from '../../services/consultaService';
import { pacienteService } from '../../services/pacienteService';
import { prontuarioService } from '../../services/prontuarioService';
import { authValue } from '../../test/authContextValue';
import { consulta, httpError, Providers } from '../../test/helpers';
import type { EvolucaoClinica, PlanoTerapeutico } from '../../types/prontuario';

jest.mock('../../services/consultaService');
jest.mock('../../services/pacienteService');
jest.mock('../../services/avaliacaoService');
jest.mock('../../services/prontuarioService');

const consultas = jest.mocked(consultaService);
const prontuario = jest.mocked(prontuarioService);

const realizada = consulta({
  id: 3,
  pacienteId: 12,
  pacienteNome: 'Marcos Coelho',
  dataHora: '2025-08-22T09:00:00',
  status: 'REALIZADA',
});
const anterior = consulta({
  id: 2,
  pacienteId: 12,
  pacienteNome: 'Marcos Coelho',
  dataHora: '2025-08-15T15:00:00',
  status: 'REALIZADA',
});

const v2: PlanoTerapeutico = {
  id: 5,
  pacienteId: 12,
  profissionalId: 1,
  profissionalNome: 'Dra. Ana',
  revisao: 2,
  objetivos: 'Reduzir a dor e recuperar a amplitude completa do ombro.',
  condutas: 'Fortalecimento de manguito rotador, 2x/semana.',
  dataInicio: '2025-08-12',
  dataFimPrevista: '2025-09-30',
  status: 'ATIVO',
  visivelPaciente: true,
  dataCriacao: '2025-08-22T10:00:00',
};
const v1: PlanoTerapeutico = {
  ...v2,
  id: 4,
  revisao: 1,
  objetivos: 'Reduzir a dor.',
  status: 'SUBSTITUIDO',
  visivelPaciente: false,
};

const visivel: EvolucaoClinica = {
  id: 21,
  pacienteId: 12,
  profissionalId: 1,
  profissionalNome: 'Dra. Ana',
  consultaId: 3,
  observacoes: 'Melhora da dor ao elevar o braço. Mantidos exercícios isométricos.',
  procedimentos: null,
  respostaPaciente: null,
  conduta: 'Manter isometria',
  visivelPaciente: true,
  dataRegistro: '2025-08-22T09:50:00',
};
const privada: EvolucaoClinica = {
  ...visivel,
  id: 20,
  consultaId: 2,
  observacoes: 'Dor 6/10 na abdução. Iniciado fortalecimento com elástico leve.',
  conduta: null,
  visivelPaciente: false,
  dataRegistro: '2025-08-15T15:40:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  consultas.listarTodos.mockResolvedValue([realizada, anterior]);
  consultas.buscarPorId.mockResolvedValue(realizada);
  jest.mocked(pacienteService).listarTodos.mockResolvedValue([]);
  jest.mocked(avaliacaoService).buscarPorConsulta.mockRejectedValue(httpError(404));
  prontuario.listarPlanos.mockResolvedValue([v2, v1]);
  prontuario.listarEvolucoes.mockResolvedValue([visivel, privada]);
});

async function abrirProntuario() {
  await render(
    <Providers navigation>
      <AuthContext.Provider value={authValue()}>
        <ConfirmDialogProvider>
          <ProfissionalNavigator />
        </ConfirmDialogProvider>
      </AuthContext.Provider>
    </Providers>,
  );
  await fireEvent.press(await screen.findByTestId('tab-consultas'));
  await fireEvent.press(await screen.findByTestId('consulta-3'));
  await fireEvent.press(await screen.findByTestId('consulta-prontuario'));
  await screen.findByRole('header', { name: 'Prontuário' });
}

describe('Prontuário do profissional', () => {
  it('consulta não realizada não abre o prontuário (segue para o registro clínico)', async () => {
    consultas.listarTodos.mockResolvedValue([{ ...realizada, status: 'AGENDADA' }]);
    consultas.buscarPorId.mockResolvedValue({ ...realizada, status: 'AGENDADA' });
    await render(
      <Providers navigation>
        <AuthContext.Provider value={authValue()}>
          <ConfirmDialogProvider>
            <ProfissionalNavigator />
          </ConfirmDialogProvider>
        </AuthContext.Provider>
      </Providers>,
    );
    await fireEvent.press(await screen.findByTestId('tab-consultas'));
    await fireEvent.press(await screen.findByTestId('consulta-3'));
    expect(await screen.findByTestId('consulta-continuar-registro')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-prontuario')).toBeNull();
  });

  it('mostra o plano em vigor com a versão e o histórico de evoluções', async () => {
    await abrirProntuario();

    expect(prontuario.listarPlanos).toHaveBeenCalledWith(12);
    expect(prontuario.listarEvolucoes).toHaveBeenCalledWith(12);
    expect(screen.getByTestId('prontuario-paciente')).toHaveTextContent('Marcos Coelho');

    const plano = await screen.findByTestId('plano-5');
    expect(within(plano).getByText('Ativo · v2')).toBeOnTheScreen();
    expect(within(plano).getByText(v2.objetivos)).toBeOnTheScreen();
    expect(within(plano).getByText(v2.condutas)).toBeOnTheScreen();
    expect(
      within(plano).getByText('Início 12/08/2025 · Previsão 30/09/2025 · Visível ao paciente'),
    ).toBeOnTheScreen();

    const recente = screen.getByTestId('evolucao-21');
    expect(within(recente).getByText('22/08/2025 · Consulta 09:00')).toBeOnTheScreen();
    expect(within(recente).getByText('Visível ao paciente')).toBeOnTheScreen();
    expect(within(recente).getByText(visivel.observacoes)).toBeOnTheScreen();
    expect(within(recente).getByText('Conduta: Manter isometria')).toBeOnTheScreen();

    const antiga = screen.getByTestId('evolucao-20');
    expect(within(antiga).getByText('15/08/2025 · Consulta 15:00')).toBeOnTheScreen();
    expect(within(antiga).getByText('Privada')).toBeOnTheScreen();
  });

  it('versões anteriores do plano ficam recolhidas até pedir', async () => {
    await abrirProntuario();
    await screen.findByTestId('plano-5');
    expect(screen.queryByTestId('plano-4')).toBeNull();

    const alternar = screen.getByTestId('prontuario-versoes');
    expect(alternar).toHaveTextContent('Ver 1 versão anterior');
    await fireEvent.press(alternar);

    const versao = await screen.findByTestId('plano-4');
    expect(within(versao).getByText('Substituído · v1')).toBeOnTheScreen();
    expect(within(versao).getByText('Reduzir a dor.')).toBeOnTheScreen();
    expect(
      within(versao).getByText('Início 12/08/2025 · Previsão 30/09/2025 · Privado'),
    ).toBeOnTheScreen();
    expect(alternar).toHaveTextContent('Ocultar 1 versão anterior');
  });

  it('estado vazio: sem plano e sem evoluções', async () => {
    prontuario.listarPlanos.mockResolvedValue([]);
    prontuario.listarEvolucoes.mockResolvedValue([]);
    await abrirProntuario();

    expect(await screen.findByTestId('prontuario-sem-plano')).toHaveTextContent(
      'Nenhum plano terapêutico registrado.',
    );
    expect(screen.getByTestId('prontuario-sem-evolucoes')).toHaveTextContent(
      'Nenhuma evolução registrada.',
    );
    expect(screen.queryByTestId('prontuario-versoes')).toBeNull();
    // As ações continuam disponíveis para começar o prontuário.
    expect(screen.getByTestId('prontuario-revisar-plano')).toBeOnTheScreen();
    expect(screen.getByTestId('prontuario-nova-evolucao')).toBeOnTheScreen();
  });

  it('sem a lista de consultas, o cabeçalho usa a data do registro', async () => {
    consultas.listarTodos.mockImplementation(async (pacienteId?: number) => {
      if (pacienteId === 12) {
        throw httpError(500);
      }
      return [realizada];
    });
    await abrirProntuario();
    const recente = await screen.findByTestId('evolucao-21');
    expect(within(recente).getByText('22/08/2025 · Registro 09:50')).toBeOnTheScreen();
  });

  it('erro ao carregar, com tentar de novo', async () => {
    prontuario.listarEvolucoes.mockRejectedValueOnce(httpError(500));
    await abrirProntuario();

    expect(await screen.findByText('Não foi possível carregar o prontuário.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('evolucao-21')).toBeOnTheScreen();
  });

  it('404: paciente não encontrado, sem tentar de novo', async () => {
    prontuario.listarPlanos.mockRejectedValue(httpError(404));
    prontuario.listarEvolucoes.mockRejectedValue(httpError(404));
    await abrirProntuario();

    expect(await screen.findByText('Paciente não encontrado.')).toBeOnTheScreen();
    expect(screen.queryByText('Tentar novamente')).toBeNull();
  });

  it('"Consulta" volta para o detalhe da consulta', async () => {
    await abrirProntuario();
    await fireEvent.press(screen.getByTestId('prontuario-voltar'));
    expect(await screen.findByTestId('consulta-detalhe-paciente')).toBeOnTheScreen();
  });

  it('revisar plano a partir do prontuário salva uma nova versão e mostra no histórico', async () => {
    const v3: PlanoTerapeutico = { ...v2, id: 6, revisao: 3, condutas: 'Isometria 3x/semana' };
    prontuario.revisarPlano.mockResolvedValue(v3);
    await abrirProntuario();
    await fireEvent.press(screen.getByTestId('prontuario-revisar-plano'));
    await fireEvent.changeText(await screen.findByTestId('plano-condutas'), 'Isometria 3x/semana');

    prontuario.listarPlanos.mockResolvedValue([v3, { ...v2, status: 'SUBSTITUIDO' }, v1]);
    await fireEvent.press(screen.getByTestId('plano-salvar'));

    expect(await screen.findByTestId('prontuario-aviso')).toHaveTextContent(
      'Nova versão do plano salva.',
    );
    const plano = await screen.findByTestId('plano-6');
    expect(within(plano).getByText('Ativo · v3')).toBeOnTheScreen();
    expect(screen.getByTestId('prontuario-versoes')).toHaveTextContent('Ver 2 versões anteriores');
    await waitFor(() => expect(prontuario.listarEvolucoes.mock.calls.length).toBeGreaterThan(1));
  });
});
