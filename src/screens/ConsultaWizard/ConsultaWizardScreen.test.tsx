import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../contexts/AuthContext';
import { queryKeys } from '../../hooks/queryKeys';
import { ProfissionalNavigator } from '../../navigation/ProfissionalNavigator';
import type { ProfissionalStackParamList } from '../../navigation/types';
import { avaliacaoService } from '../../services/avaliacaoService';
import { consultaService } from '../../services/consultaService';
import { pacienteService } from '../../services/pacienteService';
import { authValue } from '../../test/authContextValue';
import { consulta, createTestQueryClient, httpError, networkError } from '../../test/helpers';
import type { Consulta, ConsultaUpdateRequest } from '../../types/consulta';

jest.mock('../../services/consultaService');
jest.mock('../../services/pacienteService');
jest.mock('../../services/avaliacaoService');

const consultas = jest.mocked(consultaService);
const pacientes = jest.mocked(pacienteService);
const avaliacoes = jest.mocked(avaliacaoService);

const nav = createNavigationContainerRef<ProfissionalStackParamList>();

const vazia = consulta({
  id: 1,
  pacienteNome: 'Maria Souza',
  dataHora: '2026-09-30T14:30:00',
  status: 'CONFIRMADA',
  convenio: 'Unimed',
  valor: 150,
});
const base = {
  dataHora: '2026-09-30T14:30:00',
  tipo: 'PRESENCIAL',
  status: 'CONFIRMADA',
  convenio: 'Unimed',
  valor: 150,
};
const quadroSalvo = { ...vazia.quadroClinico, queixaPrincipal: '' };
const habitosSalvos = { ...vazia.habitosVida, atividadeFisica: 'Caminhada', tabagismo: true };

/** Guarda a consulta "no backend": cada PUT mescla os blocos enviados, como o backend real. */
let noBackend: Consulta;

beforeEach(() => {
  jest.clearAllMocks();
  noBackend = vazia;
  consultas.listarTodos.mockResolvedValue([]);
  consultas.buscarPorId.mockImplementation(async () => noBackend);
  consultas.atualizar.mockImplementation(async (_id, r: ConsultaUpdateRequest) => {
    noBackend = {
      ...noBackend,
      status: r.status,
      quadroClinico: r.quadroClinico ?? noBackend.quadroClinico,
      habitosVida: r.habitosVida ?? noBackend.habitosVida,
      exameFisico: r.exameFisico ?? noBackend.exameFisico,
      diagnostico: r.diagnostico ?? noBackend.diagnostico,
    };
  });
  pacientes.listarTodos.mockResolvedValue([]);
  avaliacoes.buscarPorConsulta.mockRejectedValue(httpError(404));
});

async function renderApp(queryClient: QueryClient = createTestQueryClient()) {
  await render(
    <QueryClientProvider client={queryClient}>
      <NavigationContainer ref={nav}>
        <AuthContext.Provider value={authValue()}>
          <ConfirmDialogProvider>
            <ProfissionalNavigator />
          </ConfirmDialogProvider>
        </AuthContext.Provider>
      </NavigationContainer>
    </QueryClientProvider>,
  );
}

/** Abre o registro clínico direto (como "Iniciar consulta" na home). */
async function abrirWizard(queryClient?: QueryClient) {
  await renderApp(queryClient);
  await act(async () => nav.navigate('ConsultaWizard', { id: 1 }));
  await screen.findByTestId('wizard-titulo');
}

const titulo = () => screen.getByTestId('wizard-titulo');
const preencher = (testID: string, texto: string) =>
  fireEvent.changeText(screen.getByTestId(testID), texto);
const escolher = (grupo: string, opcao: string) =>
  fireEvent.press(within(screen.getByTestId(grupo)).getByRole('radio', { name: opcao }));
const proximo = () => fireEvent.press(screen.getByTestId('wizard-proximo'));
const rotas = () => nav.getRootState()?.routes.map((r) => r.name);

describe('Registro clínico: preenchimento completo', () => {
  it('salva etapa por etapa (só o bloco da etapa) e finaliza como REALIZADA', async () => {
    await abrirWizard();

    expect(titulo()).toHaveTextContent('Quadro Clínico');
    expect(screen.getByTestId('wizard-passo')).toHaveTextContent('Passo 1 de 4');
    expect(screen.getByText('Maria Souza')).toBeOnTheScreen();
    expect(screen.queryByTestId('wizard-voltar')).not.toBeOnTheScreen();

    // 1. Quadro clínico
    await preencher('wizard-queixa', 'Dor lombar');
    await preencher('wizard-historia', 'Há 2 semanas');
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Hipertensão' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Asma' }));
    expect(screen.getByRole('checkbox', { name: 'Asma' })).toBeChecked();
    expect(screen.queryByTestId('wizard-outras')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Outras' }));
    await preencher('wizard-outras', 'Fibromialgia');
    expect(screen.queryByTestId('wizard-cirurgias-descricao')).not.toBeOnTheScreen();
    await escolher('wizard-cirurgias', 'Sim');
    await preencher('wizard-cirurgias-descricao', 'Joelho (2019)');
    await preencher('wizard-medicamentos', 'Dipirona');
    await proximo();

    await waitFor(() => expect(titulo()).toHaveTextContent('Hábitos de Vida'));
    expect(consultas.atualizar).toHaveBeenLastCalledWith(1, {
      ...base,
      quadroClinico: {
        queixaPrincipal: 'Dor lombar',
        historiaDoencaAtual: 'Há 2 semanas',
        historicoSaude: 'Hipertensão, Asma, Fibromialgia',
        cirurgias: true,
        cirurgiasDescricao: 'Joelho (2019)',
        lesoesAnteriores: false,
        lesoesAnterioresDescricao: '',
        medicamentos: 'Dipirona',
      },
    });
    expect(screen.getByTestId('wizard-passo')).toHaveTextContent('Passo 2 de 4');

    // 2. Hábitos de vida
    await preencher('wizard-atividade', 'Caminhada');
    await escolher('wizard-tabagismo', 'Sim');
    await proximo();
    await waitFor(() => expect(titulo()).toHaveTextContent('Exame Físico'));
    expect(consultas.atualizar).toHaveBeenLastCalledWith(1, {
      ...base,
      habitosVida: {
        atividadeFisica: 'Caminhada',
        rotinaTrabalho: '',
        tabagismo: true,
        consumoAlcool: false,
      },
    });

    // 3. Exame físico
    await preencher('wizard-postura', 'Hiperlordose');
    await preencher('wizard-forca', 'Grau 4');
    await proximo();
    await waitFor(() => expect(titulo()).toHaveTextContent('Diagnóstico'));
    expect(consultas.atualizar).toHaveBeenLastCalledWith(1, {
      ...base,
      exameFisico: {
        postura: 'Hiperlordose',
        amplitudeMovimento: '',
        palpacao: '',
        forcaMuscular: 'Grau 4',
      },
    });

    // 4. Diagnóstico: finaliza
    await preencher('wizard-plano', 'Fisioterapia 2x/semana');
    await preencher('wizard-objetivos', 'Reduzir a dor');
    await proximo();
    expect(await screen.findByText('Consulta realizada com sucesso!')).toBeOnTheScreen();
    expect(consultas.atualizar).toHaveBeenLastCalledWith(1, {
      ...base,
      status: 'REALIZADA',
      diagnostico: {
        planoTratamento: 'Fisioterapia 2x/semana',
        objetivosTratamento: 'Reduzir a dor',
      },
    });
    expect(consultas.atualizar).toHaveBeenCalledTimes(4);

    // "Visualizar" abre o prontuário no lugar do wizard.
    await fireEvent.press(screen.getByTestId('wizard-visualizar'));
    expect(await screen.findByTestId('consulta-detalhe-paciente')).toHaveTextContent('Maria Souza');
    expect(rotas()).toEqual(['Tabs', 'ConsultaDetalhe']);
    expect(screen.getByTestId('secao-Diagnóstico')).toBeOnTheScreen();
  });

  it('mostra "Salvando..." e bloqueia o botão enquanto salva', async () => {
    let concluir: () => void = () => undefined;
    consultas.atualizar.mockImplementation(
      () => new Promise<void>((resolve) => (concluir = resolve)),
    );
    await abrirWizard();
    await proximo();

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
    await act(async () => concluir());
    await waitFor(() => expect(titulo()).toHaveTextContent('Hábitos de Vida'));
  });

  it('"Não" em cirurgias e lesões esconde a descrição', async () => {
    await abrirWizard();
    await escolher('wizard-lesoes', 'Sim');
    expect(screen.getByTestId('wizard-lesoes-descricao')).toBeOnTheScreen();
    await escolher('wizard-lesoes', 'Não');
    expect(screen.queryByTestId('wizard-lesoes-descricao')).not.toBeOnTheScreen();
  });
});

describe('Registro clínico: retomada e voltar', () => {
  it.each([
    ['nada salvo', {}, 'Quadro Clínico'],
    ['quadro salvo', { quadroClinico: quadroSalvo }, 'Hábitos de Vida'],
    [
      'quadro e hábitos salvos',
      { quadroClinico: quadroSalvo, habitosVida: habitosSalvos },
      'Exame Físico',
    ],
    [
      'três etapas salvas',
      {
        quadroClinico: quadroSalvo,
        habitosVida: habitosSalvos,
        exameFisico: { ...vazia.exameFisico, postura: '' },
      },
      'Diagnóstico',
    ],
  ])('%s → abre em "%s"', async (_caso, parcial: Partial<Consulta>, esperado) => {
    noBackend = { ...vazia, ...parcial };
    await abrirWizard();
    expect(titulo()).toHaveTextContent(esperado);
  });

  it('consulta já realizada abre direto no sucesso', async () => {
    noBackend = { ...vazia, status: 'REALIZADA' };
    await renderApp();
    await act(async () => nav.navigate('ConsultaWizard', { id: 1 }));
    expect(await screen.findByText('Consulta realizada com sucesso!')).toBeOnTheScreen();
  });

  it('voltar mostra o que já foi salvo e salvar de novo avança para a etapa seguinte', async () => {
    noBackend = { ...vazia, quadroClinico: quadroSalvo, habitosVida: habitosSalvos };
    await abrirWizard();
    expect(titulo()).toHaveTextContent('Exame Físico');

    await fireEvent.press(screen.getByTestId('wizard-voltar'));
    expect(titulo()).toHaveTextContent('Hábitos de Vida');
    expect(screen.getByTestId('wizard-atividade')).toHaveDisplayValue('Caminhada');
    expect(
      within(screen.getByTestId('wizard-tabagismo')).getByRole('radio', { name: 'Sim' }),
    ).toBeChecked();

    await fireEvent.press(screen.getByTestId('wizard-voltar'));
    expect(titulo()).toHaveTextContent('Quadro Clínico');
    expect(screen.queryByTestId('wizard-voltar')).not.toBeOnTheScreen();

    await preencher('wizard-queixa', 'Dor no ombro');
    await proximo();
    await waitFor(() => expect(titulo()).toHaveTextContent('Hábitos de Vida'));
    expect(consultas.atualizar).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({
        quadroClinico: expect.objectContaining({ queixaPrincipal: 'Dor no ombro' }),
      }),
    );
  });

  it('reabre com "Outras" marcado e preenchido; desmarcar tira o texto livre do que é salvo', async () => {
    noBackend = {
      ...vazia,
      quadroClinico: { ...quadroSalvo, historicoSaude: 'Hipertensão, Fibromialgia' },
    };
    await abrirWizard();
    await fireEvent.press(screen.getByTestId('wizard-voltar'));

    expect(screen.getByRole('checkbox', { name: 'Hipertensão' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Outras' })).toBeChecked();
    expect(screen.getByTestId('wizard-outras')).toHaveDisplayValue('Fibromialgia');

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Outras' }));
    expect(screen.queryByTestId('wizard-outras')).not.toBeOnTheScreen();
    await proximo();
    await waitFor(() => expect(consultas.atualizar).toHaveBeenCalled());
    expect(consultas.atualizar.mock.calls[0][1].quadroClinico?.historicoSaude).toBe('Hipertensão');
  });

  it('não usa dados velhos do cache: espera a leitura atual para decidir a etapa', async () => {
    // Cache de antes de salvar o quadro clínico; o backend já tem o quadro salvo.
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.consultas.detalhe(1), vazia);
    noBackend = { ...vazia, quadroClinico: quadroSalvo };

    await abrirWizard(queryClient);
    expect(titulo()).toHaveTextContent('Hábitos de Vida');
  });

  it('"Visualizar" volta ao prontuário quando o wizard foi aberto por ele', async () => {
    noBackend = {
      ...vazia,
      quadroClinico: quadroSalvo,
      habitosVida: habitosSalvos,
      exameFisico: { ...vazia.exameFisico, postura: '' },
    };
    await renderApp();
    await act(async () => nav.navigate('ConsultaDetalhe', { id: 1 }));
    await fireEvent.press(await screen.findByTestId('consulta-continuar-registro'));
    await screen.findByTestId('wizard-titulo');
    await proximo();
    await fireEvent.press(await screen.findByTestId('wizard-visualizar'));

    await waitFor(() => expect(rotas()).toEqual(['Tabs', 'ConsultaDetalhe']));
    // O prontuário é recarregado: sem o atalho, porque a consulta foi realizada.
    await waitFor(() =>
      expect(screen.queryByTestId('consulta-continuar-registro')).not.toBeOnTheScreen(),
    );
  });
});

describe('Registro clínico: erros', () => {
  it('erro ao carregar, com "Tentar novamente"', async () => {
    consultas.buscarPorId.mockRejectedValue(httpError(500));
    await renderApp();
    await act(async () => nav.navigate('ConsultaWizard', { id: 1 }));
    expect(await screen.findByText('Não foi possível carregar a consulta.')).toBeOnTheScreen();

    consultas.buscarPorId.mockResolvedValue(vazia);
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('wizard-titulo')).toHaveTextContent('Quadro Clínico');
  });

  it('erro ao salvar fica na etapa, mantém o que foi digitado e permite tentar de novo', async () => {
    consultas.atualizar.mockRejectedValueOnce(httpError(500));
    await abrirWizard();
    await preencher('wizard-queixa', 'Dor lombar');
    await proximo();

    expect(await screen.findByTestId('wizard-erro')).toHaveTextContent(
      'Não foi possível salvar. Tente novamente.',
    );
    expect(titulo()).toHaveTextContent('Quadro Clínico');
    expect(screen.getByTestId('wizard-queixa')).toHaveDisplayValue('Dor lombar');

    await proximo();
    await waitFor(() => expect(titulo()).toHaveTextContent('Hábitos de Vida'));
    expect(screen.queryByTestId('wizard-erro')).not.toBeOnTheScreen();
  });

  it('sem conexão ao salvar', async () => {
    consultas.atualizar.mockRejectedValue(networkError());
    await abrirWizard();
    await proximo();
    expect(await screen.findByTestId('wizard-erro')).toHaveTextContent(
      'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
    );
  });

  it('a recarga depois de salvar falhando não derruba o wizard', async () => {
    await abrirWizard();
    consultas.buscarPorId.mockRejectedValue(httpError(500));
    await preencher('wizard-queixa', 'Dor lombar');
    await proximo();
    await waitFor(() => expect(titulo()).toHaveTextContent('Hábitos de Vida'));
    expect(screen.queryByText('Não foi possível carregar a consulta.')).not.toBeOnTheScreen();
  });
});
