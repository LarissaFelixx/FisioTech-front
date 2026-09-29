import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../contexts/AuthContext';
import { ProfissionalNavigator } from '../../navigation/ProfissionalNavigator';
import { avaliacaoService } from '../../services/avaliacaoService';
import { consultaService } from '../../services/consultaService';
import { pacienteService } from '../../services/pacienteService';
import { authValue } from '../../test/authContextValue';
import { consulta, httpError, Providers } from '../../test/helpers';
import type { Paciente } from '../../types/paciente';

jest.mock('../../services/consultaService');
jest.mock('../../services/pacienteService');
jest.mock('../../services/avaliacaoService');

const consultas = jest.mocked(consultaService);
const pacientes = jest.mocked(pacienteService);
const avaliacoes = jest.mocked(avaliacaoService);

const paciente = (id: number, nome: string, email: string) =>
  ({ id, nome, email, dataCriacao: '2026-09-01T10:00:00' }) as Paciente;

const lista = [
  consulta({
    id: 1,
    pacienteNome: 'Maria Souza',
    dataHora: '2026-09-29T08:30:00',
    status: 'CONFIRMADA',
    convenio: 'Unimed',
  }),
  consulta({
    id: 2,
    pacienteNome: 'João Lima',
    dataHora: '2026-09-29T15:00:00',
    status: 'CANCELADA',
    tipo: 'ONLINE',
  }),
  consulta({
    id: 3,
    pacienteNome: 'Rui Alves',
    dataHora: '2026-09-28T10:00:00',
    status: 'REALIZADA',
    foiRemarcada: true,
  }),
];

beforeEach(() => {
  jest.clearAllMocks();
  consultas.listarTodos.mockResolvedValue(lista);
  consultas.buscarPorId.mockImplementation(
    async (id) => lista.find((c) => c.id === id) ?? consulta({ id }),
  );
  consultas.criar.mockResolvedValue(99);
  consultas.deletar.mockResolvedValue(undefined);
  pacientes.listarTodos.mockResolvedValue([
    paciente(10, 'Maria Souza', 'maria@x.com'),
    paciente(11, 'João Lima', 'joao@x.com'),
  ]);
  pacientes.buscarPorId.mockImplementation(async (id) =>
    paciente(id, 'Maria Souza', 'maria@x.com'),
  );
  pacientes.criar.mockResolvedValue(undefined);
  avaliacoes.buscarPorConsulta.mockRejectedValue(httpError(404));
});

async function renderApp() {
  await render(
    <Providers navigation>
      <AuthContext.Provider value={authValue()}>
        <ConfirmDialogProvider>
          <ProfissionalNavigator />
        </ConfirmDialogProvider>
      </AuthContext.Provider>
    </Providers>,
  );
}

async function abrirAbaConsultas() {
  await renderApp();
  await fireEvent.press(screen.getByTestId('tab-consultas'));
  await screen.findByRole('header', { name: 'Consultas' });
}

const preencher = (testID: string, texto: string) =>
  fireEvent.changeText(screen.getByTestId(testID), texto);

describe('Lista de consultas', () => {
  it('agrupa por dia (mais recente primeiro) com horário, tipo, convênio e status', async () => {
    await abrirAbaConsultas();

    expect(await screen.findByText('TERÇA-FEIRA, 29 DE SETEMBRO')).toBeOnTheScreen();
    expect(screen.getByText('SEGUNDA-FEIRA, 28 DE SETEMBRO')).toBeOnTheScreen();
    const maria = screen.getByTestId('consulta-1');
    expect(within(maria).getByText('08:30 · Presencial · Unimed')).toBeOnTheScreen();
    expect(within(maria).getByText('Confirmada')).toBeOnTheScreen();
    expect(within(screen.getByTestId('consulta-2')).getByText('Cancelada')).toBeOnTheScreen();
  });

  it('filtros: agendadas, canceladas e remarcadas', async () => {
    await abrirAbaConsultas();
    await screen.findByTestId('consulta-1');

    await fireEvent.press(screen.getByRole('radio', { name: 'Canceladas' }));
    expect(screen.getByTestId('consulta-2')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-1')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Remarcadas' }));
    expect(screen.getByTestId('consulta-3')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-2')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Agendadas' }));
    expect(screen.getByTestId('consulta-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-3')).not.toBeOnTheScreen();
  });

  it('filtro sem resultado e lista vazia têm mensagens diferentes', async () => {
    consultas.listarTodos.mockResolvedValue([consulta({ id: 1, status: 'AGENDADA' })]);
    await abrirAbaConsultas();
    await fireEvent.press(await screen.findByRole('radio', { name: 'Canceladas' }));
    expect(screen.getByText('Nenhuma consulta neste filtro.')).toBeOnTheScreen();
  });

  it('sem consultas: orienta a abrir um paciente e esconde os filtros', async () => {
    consultas.listarTodos.mockResolvedValue([]);
    await abrirAbaConsultas();
    expect(
      await screen.findByText(
        'Nenhuma consulta ainda. Abra um paciente em "Pacientes" para iniciar uma.',
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-filtros')).not.toBeOnTheScreen();
  });

  it('erro com "Tentar novamente"', async () => {
    consultas.listarTodos.mockRejectedValue(httpError(500));
    await abrirAbaConsultas();
    expect(await screen.findByText('Não foi possível carregar as consultas.')).toBeOnTheScreen();
    consultas.listarTodos.mockResolvedValue(lista);
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('consulta-1')).toBeOnTheScreen();
  });
});

describe('Nova consulta', () => {
  async function abrirNova() {
    await abrirAbaConsultas();
    await fireEvent.press(screen.getByTestId('consulta-nova'));
    await screen.findByTestId('consulta-busca-paciente');
  }

  it('escolhe o paciente, valida data/hora e abre o registro clínico da consulta criada', async () => {
    await abrirNova();
    await preencher('consulta-busca-paciente', 'joão');
    expect(screen.queryByText('Maria Souza')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('consulta-escolher-11'));
    expect(screen.getByTestId('consulta-paciente')).toHaveTextContent('Paciente: João Lima');

    await fireEvent.press(screen.getByTestId('consulta-iniciar'));
    expect(screen.getAllByText('Este campo é obrigatório.')).toHaveLength(2);
    expect(consultas.criar).not.toHaveBeenCalled();

    await preencher('consulta-data', '30092026');
    await preencher('consulta-hora', '1430');
    await fireEvent.press(screen.getByRole('radio', { name: 'Online' }));
    await preencher('consulta-convenio', 'Unimed');
    await preencher('consulta-valor', '150,50');
    await fireEvent.press(screen.getByTestId('consulta-iniciar'));

    await waitFor(() =>
      expect(consultas.criar).toHaveBeenCalledWith({
        pacienteId: 11,
        dataHora: '2026-09-30T14:30:00',
        tipo: 'ONLINE',
        convenio: 'Unimed',
        valor: 150.5,
      }),
    );
    expect(await screen.findByText('O registro clínico chega no Batch 6.')).toBeOnTheScreen();
  });

  it('erro ao criar a consulta', async () => {
    consultas.criar.mockRejectedValue(httpError(500));
    await abrirNova();
    await fireEvent.press(screen.getByTestId('consulta-escolher-10'));
    await preencher('consulta-data', '30092026');
    await preencher('consulta-hora', '0900');
    await fireEvent.press(screen.getByTestId('consulta-iniciar'));
    expect(await screen.findByText('Não foi possível criar a consulta.')).toBeOnTheScreen();
  });

  it('cadastro rápido: cria o paciente e já o seleciona', async () => {
    await abrirNova();
    await fireEvent.press(screen.getByTestId('consulta-cadastrar-paciente'));
    await preencher('rapido-nome', 'Ana Nova');
    await preencher('rapido-email', 'ana@x.com');
    await preencher('rapido-senha', '12345678');
    pacientes.listarTodos.mockResolvedValue([paciente(12, 'Ana Nova', 'ana@x.com')]);
    await fireEvent.press(screen.getByTestId('rapido-cadastrar'));

    await waitFor(() =>
      expect(pacientes.criar).toHaveBeenCalledWith({
        nome: 'Ana Nova',
        email: 'ana@x.com',
        senha: '12345678',
      }),
    );
    expect(await screen.findByText('Paciente: Ana Nova')).toBeOnTheScreen();
  });

  it('cadastro rápido com email duplicado (409)', async () => {
    pacientes.criar.mockRejectedValue(httpError(409));
    await abrirNova();
    await fireEvent.press(screen.getByTestId('consulta-cadastrar-paciente'));
    await preencher('rapido-nome', 'Ana');
    await preencher('rapido-email', 'maria@x.com');
    await preencher('rapido-senha', '12345678');
    await fireEvent.press(screen.getByTestId('rapido-cadastrar'));
    expect(
      await screen.findByText('Já existe um paciente cadastrado com este email.'),
    ).toBeOnTheScreen();
  });

  it('vindo do paciente, já chega com ele escolhido (atalho "+ Nova Consulta")', async () => {
    await renderApp();
    await fireEvent.press(screen.getByTestId('tab-pacientes'));
    await fireEvent.press(await screen.findByTestId('paciente-10'));
    await fireEvent.press(await screen.findByTestId('paciente-nova-consulta'));

    expect(await screen.findByText('Paciente: Maria Souza')).toBeOnTheScreen();
    expect(screen.queryByText('Trocar')).not.toBeOnTheScreen();
  });
});

describe('Prontuário', () => {
  async function abrirDetalhe(id: number) {
    await abrirAbaConsultas();
    await fireEvent.press(await screen.findByTestId(`consulta-${id}`));
    await screen.findByTestId('consulta-detalhe-paciente');
  }

  it('mostra cabeçalho, dados da consulta e o atalho para o registro clínico', async () => {
    consultas.buscarPorId.mockResolvedValue(
      consulta({
        id: 1,
        pacienteNome: 'Maria Souza',
        dataHora: '2026-09-29T08:30:00',
        status: 'CONFIRMADA',
        convenio: null,
        valor: 150,
        quadroClinico: { ...consulta().quadroClinico, queixaPrincipal: 'Dor lombar' },
      }),
    );
    await abrirDetalhe(1);

    expect(screen.getByTestId('consulta-detalhe-paciente')).toHaveTextContent('Maria Souza');
    expect(screen.getByText('29/09 · 08:30')).toBeOnTheScreen();
    expect(screen.getByText('Particular')).toBeOnTheScreen();
    expect(screen.getByText('R$ 150,00')).toBeOnTheScreen();
    expect(
      within(screen.getByTestId('secao-Quadro Clínico')).getByText(/Dor lombar/),
    ).toBeOnTheScreen();
    expect(avaliacoes.buscarPorConsulta).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('consulta-continuar-registro'));
    expect(await screen.findByText('O registro clínico chega no Batch 6.')).toBeOnTheScreen();
  });

  it('consulta realizada: sem atalho do registro e com a avaliação do paciente', async () => {
    avaliacoes.buscarPorConsulta.mockResolvedValue({
      id: 1,
      consultaId: 3,
      nota: 4,
      comentario: 'Muito bom',
      dataCriacao: '2026-09-28T12:00:00',
    });
    await abrirDetalhe(3);

    const avaliacao = await screen.findByTestId('consulta-avaliacao');
    expect(within(avaliacao).getByText('★★★★☆')).toBeOnTheScreen();
    expect(within(avaliacao).getByText('Muito bom')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-continuar-registro')).not.toBeOnTheScreen();
  });

  it('realizada e ainda não avaliada (404)', async () => {
    await abrirDetalhe(3);
    expect(
      await screen.findByText('O paciente ainda não avaliou esta consulta.'),
    ).toBeOnTheScreen();
  });

  it('excluir com confirmação volta para a lista', async () => {
    await abrirDetalhe(1);
    await fireEvent.press(screen.getByTestId('consulta-excluir'));
    expect(
      await screen.findByText('Excluir esta consulta? Essa ação não pode ser desfeita.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));

    await waitFor(() => expect(consultas.deletar).toHaveBeenCalledWith(1));
    expect(await screen.findByRole('header', { name: 'Consultas' })).toBeOnTheScreen();
  });

  it('erro ao excluir fica na tela', async () => {
    consultas.deletar.mockRejectedValue(httpError(500));
    await abrirDetalhe(1);
    await fireEvent.press(screen.getByTestId('consulta-excluir'));
    await fireEvent.press(await screen.findByTestId('confirm-confirmar'));
    expect(await screen.findByText('Não foi possível excluir a consulta.')).toBeOnTheScreen();
  });

  it('erro ao carregar', async () => {
    consultas.buscarPorId.mockRejectedValue(httpError(404));
    await abrirAbaConsultas();
    await fireEvent.press(await screen.findByTestId('consulta-1'));
    expect(await screen.findByText('Não foi possível carregar a consulta.')).toBeOnTheScreen();
  });
});
