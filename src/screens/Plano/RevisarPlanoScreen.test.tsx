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
import type { PlanoTerapeutico } from '../../types/plano';
import { clock } from '../../utils/clock';

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
  status: 'REALIZADA',
});

const ativo: PlanoTerapeutico = {
  id: 5,
  pacienteId: 12,
  profissionalId: 1,
  profissionalNome: 'Dra. Ana',
  revisao: 2,
  objetivos: 'Reduzir a dor e recuperar a amplitude completa do ombro.',
  condutas: 'Fortalecimento de manguito rotador, 2x/semana.',
  dataInicio: '2025-08-22',
  dataFimPrevista: '2025-09-30',
  status: 'ATIVO',
  visivelPaciente: true,
  dataCriacao: '2025-08-22T10:00:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(clock, 'agora').mockReturnValue(new Date(2026, 9, 25, 10, 0));
  consultas.listarTodos.mockResolvedValue([realizada]);
  consultas.buscarPorId.mockResolvedValue(realizada);
  pacientes.listarTodos.mockResolvedValue([]);
  avaliacoes.buscarPorConsulta.mockRejectedValue(httpError(404));
  prontuario.listarPlanos.mockResolvedValue([
    { ...ativo, id: 4, revisao: 1, status: 'SUBSTITUIDO' },
    ativo,
  ]);
  prontuario.revisarPlano.mockResolvedValue({ ...ativo, id: 6, revisao: 3 });
});

async function abrirRevisarPlano() {
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
  await fireEvent.press(await screen.findByTestId('consulta-revisar-plano'));
  await screen.findByRole('header', { name: 'Revisar plano terapêutico' });
}

describe('Revisar plano terapêutico', () => {
  it('pré-preenche com o plano ATIVO do paciente', async () => {
    await abrirRevisarPlano();
    expect(prontuario.listarPlanos).toHaveBeenCalledWith(12);
    expect(await screen.findByTestId('plano-objetivos')).toHaveDisplayValue(ativo.objetivos);
    expect(screen.getByTestId('plano-condutas')).toHaveDisplayValue(ativo.condutas);
    expect(screen.getByTestId('plano-inicio')).toHaveDisplayValue('22/08/2025');
    expect(screen.getByTestId('plano-fim')).toHaveDisplayValue('30/09/2025');
    expect(screen.getByTestId('plano-visivel')).toHaveProp('value', true);
  });

  it('sem plano: campos vazios, início hoje e visível', async () => {
    prontuario.listarPlanos.mockResolvedValue([]);
    await abrirRevisarPlano();
    expect(await screen.findByTestId('plano-objetivos')).toHaveDisplayValue('');
    expect(screen.getByTestId('plano-inicio')).toHaveDisplayValue('25/10/2026');
    expect(screen.getByTestId('plano-fim')).toHaveDisplayValue('');
    expect(screen.getByTestId('plano-visivel')).toHaveProp('value', true);
  });

  it('salva a nova versão e volta ao prontuário', async () => {
    let concluir: () => void = () => {};
    prontuario.revisarPlano.mockReturnValue(
      new Promise((resolve) => {
        concluir = () => resolve({ ...ativo, id: 6, revisao: 3 });
      }),
    );
    await abrirRevisarPlano();
    await fireEvent.changeText(await screen.findByTestId('plano-condutas'), 'Isometria 3x/semana');
    await fireEvent.changeText(screen.getByTestId('plano-fim'), '15102025');
    await fireEvent(screen.getByTestId('plano-visivel'), 'valueChange', false);
    await fireEvent.press(screen.getByTestId('plano-salvar'));

    expect(await screen.findByText('Salvando...')).toBeOnTheScreen();
    expect(screen.getByTestId('plano-salvar')).toBeDisabled();
    expect(prontuario.revisarPlano).toHaveBeenCalledWith(12, {
      objetivos: ativo.objetivos,
      condutas: 'Isometria 3x/semana',
      dataInicio: '2025-08-22',
      dataFimPrevista: '2025-10-15',
      visivelPaciente: false,
    });
    concluir();
    expect(await screen.findByTestId('consulta-detalhe-paciente')).toBeOnTheScreen();
  });

  it('valida por campo antes de enviar', async () => {
    await abrirRevisarPlano();
    await fireEvent.changeText(await screen.findByTestId('plano-objetivos'), '');
    await fireEvent.changeText(screen.getByTestId('plano-fim'), '01082025');
    await fireEvent.press(screen.getByTestId('plano-salvar'));

    expect(await screen.findByText('Este campo é obrigatório.')).toBeOnTheScreen();
    expect(
      screen.getByText('A data final não pode ser anterior à data inicial.'),
    ).toBeOnTheScreen();
    expect(prontuario.revisarPlano).not.toHaveBeenCalled();
  });

  it('erro da API fica na tela', async () => {
    prontuario.revisarPlano.mockRejectedValue(httpError(404));
    await abrirRevisarPlano();
    await fireEvent.press(await screen.findByTestId('plano-salvar'));
    expect(await screen.findByTestId('plano-erro')).toHaveTextContent('Paciente não encontrado.');
    expect(screen.getByRole('header', { name: 'Revisar plano terapêutico' })).toBeOnTheScreen();
  });

  it('erro ao carregar, com tentar de novo', async () => {
    prontuario.listarPlanos.mockRejectedValueOnce(httpError(500));
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
    await fireEvent.press(await screen.findByTestId('consulta-revisar-plano'));

    expect(
      await screen.findByText('Não foi possível carregar o plano terapêutico.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('plano-objetivos')).toHaveDisplayValue(ativo.objetivos);
  });

  it('"Prontuário" volta sem salvar', async () => {
    await abrirRevisarPlano();
    await fireEvent.press(screen.getByTestId('plano-voltar'));
    expect(await screen.findByTestId('consulta-detalhe-paciente')).toBeOnTheScreen();
    await waitFor(() => expect(prontuario.revisarPlano).not.toHaveBeenCalled());
  });
});
