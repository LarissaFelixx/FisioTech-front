import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../contexts/AuthContext';
import { ProfissionalNavigator } from '../../navigation/ProfissionalNavigator';
import { avaliacaoService } from '../../services/avaliacaoService';
import { consultaService } from '../../services/consultaService';
import { pacienteService } from '../../services/pacienteService';
import { prontuarioService } from '../../services/prontuarioService';
import { authValue } from '../../test/authContextValue';
import { consulta, httpError, Providers } from '../../test/helpers';
import type { EvolucaoClinica } from '../../types/prontuario';

jest.mock('../../services/consultaService');
jest.mock('../../services/pacienteService');
jest.mock('../../services/avaliacaoService');
jest.mock('../../services/prontuarioService');

const consultas = jest.mocked(consultaService);
const pacientes = jest.mocked(pacienteService);
const avaliacoes = jest.mocked(avaliacaoService);
const prontuario = jest.mocked(prontuarioService);

const realizada = consulta({
  id: 3,
  pacienteId: 12,
  pacienteNome: 'Marcos Coelho',
  dataHora: '2026-08-22T09:00:00',
  status: 'REALIZADA',
});

const evolucaoCriada: EvolucaoClinica = {
  id: 30,
  pacienteId: 12,
  profissionalId: 1,
  profissionalNome: 'Dra. Ana',
  consultaId: 3,
  observacoes: 'Melhora',
  procedimentos: null,
  respostaPaciente: null,
  conduta: null,
  visivelPaciente: true,
  dataRegistro: '2026-08-22T09:40:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  consultas.listarTodos.mockResolvedValue([realizada]);
  consultas.buscarPorId.mockResolvedValue(realizada);
  pacientes.listarTodos.mockResolvedValue([]);
  avaliacoes.buscarPorConsulta.mockRejectedValue(httpError(404));
  prontuario.listarPlanos.mockResolvedValue([]);
  prontuario.listarEvolucoes.mockResolvedValue([]);
  prontuario.criarEvolucao.mockResolvedValue(evolucaoCriada);
});

async function abrirNovaEvolucao() {
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
  await fireEvent.press(await screen.findByTestId('prontuario-nova-evolucao'));
  await screen.findByRole('header', { name: 'Nova evolução' });
}

describe('Nova evolução', () => {
  it('mostra paciente e data da consulta, com visibilidade ligada por padrão', async () => {
    await abrirNovaEvolucao();
    expect(screen.getByTestId('evolucao-subtitulo')).toHaveTextContent(
      'Marcos Coelho · consulta de 22/08 09:00',
    );
    expect(screen.getByPlaceholderText('Técnicas e exercícios aplicados')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Como o paciente respondeu')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Próximos passos')).toBeOnTheScreen();
    expect(screen.getByTestId('evolucao-visivel')).toHaveProp('value', true);
  });

  it('registra a evolução e volta ao prontuário com o aviso', async () => {
    await abrirNovaEvolucao();
    await fireEvent.changeText(
      screen.getByTestId('evolucao-observacoes'),
      'Melhora da dor ao elevar o braço.',
    );
    await fireEvent.changeText(screen.getByTestId('evolucao-conduta'), 'Manter isometria');
    await fireEvent(screen.getByTestId('evolucao-visivel'), 'valueChange', false);
    await fireEvent.press(screen.getByTestId('evolucao-registrar'));

    await waitFor(() =>
      expect(prontuario.criarEvolucao).toHaveBeenCalledWith(12, {
        consultaId: 3,
        observacoes: 'Melhora da dor ao elevar o braço.',
        procedimentos: null,
        respostaPaciente: null,
        conduta: 'Manter isometria',
        visivelPaciente: false,
      }),
    );
    expect(await screen.findByTestId('prontuario-aviso')).toHaveTextContent('Evolução registrada.');
    expect(screen.getByTestId('prontuario-paciente')).toHaveTextContent('Marcos Coelho');
    // O histórico do prontuário é recarregado com a evolução nova.
    await waitFor(() => expect(prontuario.listarEvolucoes.mock.calls.length).toBeGreaterThan(1));
  });

  it('mostra carregamento no botão enquanto envia', async () => {
    let concluir: () => void = () => {};
    prontuario.criarEvolucao.mockReturnValue(
      new Promise((resolve) => {
        concluir = () => resolve(evolucaoCriada);
      }),
    );
    await abrirNovaEvolucao();
    await fireEvent.changeText(screen.getByTestId('evolucao-observacoes'), 'Melhora');
    await fireEvent.press(screen.getByTestId('evolucao-registrar'));

    expect(await screen.findByText('Registrando...')).toBeOnTheScreen();
    expect(screen.getByTestId('evolucao-registrar')).toBeDisabled();
    concluir();
    expect(await screen.findByTestId('prontuario-aviso')).toBeOnTheScreen();
    await waitFor(() => expect(prontuario.listarEvolucoes.mock.calls.length).toBeGreaterThan(1));
  });

  it('exige observações antes de enviar', async () => {
    await abrirNovaEvolucao();
    await fireEvent.press(screen.getByTestId('evolucao-registrar'));
    expect(await screen.findByText('Este campo é obrigatório.')).toBeOnTheScreen();
    expect(prontuario.criarEvolucao).not.toHaveBeenCalled();
  });

  it('erro da API fica na tela', async () => {
    prontuario.criarEvolucao.mockRejectedValue(httpError(500));
    await abrirNovaEvolucao();
    await fireEvent.changeText(screen.getByTestId('evolucao-observacoes'), 'Melhora');
    await fireEvent.press(screen.getByTestId('evolucao-registrar'));
    expect(await screen.findByText('Não foi possível registrar a evolução.')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Nova evolução' })).toBeOnTheScreen();
  });

  it('"Prontuário" volta sem registrar', async () => {
    await abrirNovaEvolucao();
    await fireEvent.press(screen.getByTestId('evolucao-voltar'));
    expect(await screen.findByTestId('prontuario-paciente')).toBeOnTheScreen();
    expect(screen.queryByTestId('prontuario-aviso')).toBeNull();
    // Recarrega ao voltar ao foco.
    await waitFor(() => expect(prontuario.listarEvolucoes.mock.calls.length).toBeGreaterThan(1));
    expect(prontuario.criarEvolucao).not.toHaveBeenCalled();
  });
});
