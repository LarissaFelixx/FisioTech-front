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

beforeEach(() => {
  jest.clearAllMocks();
  consultas.listarTodos.mockResolvedValue([realizada]);
  consultas.buscarPorId.mockResolvedValue(realizada);
  pacientes.listarTodos.mockResolvedValue([]);
  avaliacoes.buscarPorConsulta.mockRejectedValue(httpError(404));
  prontuario.criarEvolucao.mockResolvedValue(undefined);
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
  await fireEvent.press(await screen.findByTestId('consulta-nova-evolucao'));
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

  it('registra a evolução e volta ao prontuário', async () => {
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
    expect(await screen.findByTestId('consulta-detalhe-paciente')).toBeOnTheScreen();
  });

  it('mostra carregamento no botão enquanto envia', async () => {
    let concluir: () => void = () => {};
    prontuario.criarEvolucao.mockReturnValue(
      new Promise<void>((resolve) => {
        concluir = resolve;
      }),
    );
    await abrirNovaEvolucao();
    await fireEvent.changeText(screen.getByTestId('evolucao-observacoes'), 'Melhora');
    await fireEvent.press(screen.getByTestId('evolucao-registrar'));

    expect(await screen.findByText('Registrando...')).toBeOnTheScreen();
    expect(screen.getByTestId('evolucao-registrar')).toBeDisabled();
    concluir();
    expect(await screen.findByTestId('consulta-detalhe-paciente')).toBeOnTheScreen();
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
    expect(await screen.findByTestId('consulta-detalhe-paciente')).toBeOnTheScreen();
    expect(prontuario.criarEvolucao).not.toHaveBeenCalled();
  });
});
