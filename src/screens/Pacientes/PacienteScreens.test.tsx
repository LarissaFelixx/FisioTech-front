import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../contexts/AuthContext';
import { ProfissionalNavigator } from '../../navigation/ProfissionalNavigator';
import { consultaService } from '../../services/consultaService';
import { pacienteService } from '../../services/pacienteService';
import { mensagemService } from '../../services/mensagemService';
import { authValue } from '../../test/authContextValue';
import { consulta, httpError, Providers } from '../../test/helpers';
import type { Paciente } from '../../types/paciente';

jest.mock('../../services/consultaService');
jest.mock('../../services/pacienteService');
jest.mock('../../services/mensagemService');

const svc = jest.mocked(pacienteService);
const consultas = jest.mocked(consultaService);

const paciente = (parcial: Partial<Paciente> = {}): Paciente => ({
  id: 1,
  nome: 'Maria Souza',
  email: 'maria@x.com',
  profissionalId: 9,
  profissionalNome: 'Dra. Ana',
  dataNascimento: '1990-01-31',
  sexo: 'Feminino',
  profissao: 'Engenheira',
  telefone: null,
  endereco: null,
  bairro: 'Centro',
  foto: null,
  dataCriacao: '2026-09-01T10:00:00',
  ...parcial,
});

const lista = [
  paciente({ id: 1, nome: 'Maria Souza', email: 'maria@x.com' }),
  paciente({ id: 2, nome: 'João Lima', email: 'joao@clinica.com' }),
];

beforeEach(() => {
  jest.clearAllMocks();
  svc.listarTodos.mockResolvedValue(lista);
  svc.buscarPorId.mockImplementation(
    async (id) => lista.find((p) => p.id === id) ?? paciente({ id }),
  );
  svc.criar.mockResolvedValue(undefined);
  svc.atualizar.mockResolvedValue(undefined);
  svc.deletar.mockResolvedValue(undefined);
  consultas.listarTodos.mockResolvedValue([]);
  jest.mocked(mensagemService.listarPorPaciente).mockResolvedValue([]);
});

async function abrirAbaPacientes() {
  await render(
    <Providers navigation>
      <AuthContext.Provider value={authValue()}>
        <ConfirmDialogProvider>
          <ProfissionalNavigator />
        </ConfirmDialogProvider>
      </AuthContext.Provider>
    </Providers>,
  );
  await fireEvent.press(screen.getByTestId('tab-pacientes'));
  await screen.findByRole('header', { name: 'Pacientes' });
}

const preencher = (testID: string, texto: string) =>
  fireEvent.changeText(screen.getByTestId(testID), texto);

describe('Lista de pacientes', () => {
  it('lista nome e email e filtra pela busca', async () => {
    await abrirAbaPacientes();

    expect(await screen.findByText('Maria Souza')).toBeOnTheScreen();
    expect(screen.getByText('joao@clinica.com')).toBeOnTheScreen();

    await preencher('paciente-busca', 'clinica');
    expect(screen.queryByText('Maria Souza')).not.toBeOnTheScreen();
    expect(screen.getByText('João Lima')).toBeOnTheScreen();

    await preencher('paciente-busca', 'ninguém');
    expect(screen.getByText('Nenhum paciente encontrado.')).toBeOnTheScreen();
  });

  it('estado vazio', async () => {
    svc.listarTodos.mockResolvedValue([]);
    await abrirAbaPacientes();
    expect(await screen.findByText('Nenhum paciente encontrado.')).toBeOnTheScreen();
  });

  it('erro com "Tentar novamente"', async () => {
    // Falha até o usuário tocar em "Tentar novamente".
    svc.listarTodos.mockRejectedValue(httpError(500));
    await abrirAbaPacientes();

    expect(await screen.findByText('Não foi possível carregar os pacientes.')).toBeOnTheScreen();
    svc.listarTodos.mockResolvedValue(lista);
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByText('Maria Souza')).toBeOnTheScreen();
  });
});

describe('Cadastro de paciente', () => {
  async function abrirCadastro() {
    await abrirAbaPacientes();
    await fireEvent.press(screen.getByTestId('paciente-novo'));
    await screen.findByTestId('paciente-nome');
  }

  it('mostra só nome, email e senha, e exige a senha', async () => {
    await abrirCadastro();

    expect(screen.queryByTestId('paciente-dataNascimento')).not.toBeOnTheScreen();
    await preencher('paciente-nome', 'Ana Paula');
    await preencher('paciente-email', 'ana@x.com');
    await fireEvent.press(screen.getByTestId('paciente-salvar'));

    expect(screen.getByText('Este campo é obrigatório.')).toBeOnTheScreen();
    expect(svc.criar).not.toHaveBeenCalled();
  });

  it('cadastra e volta para a lista', async () => {
    await abrirCadastro();
    await preencher('paciente-nome', 'Ana Paula');
    await preencher('paciente-email', 'ana@x.com');
    await preencher('paciente-senha', '12345678');
    await fireEvent.press(screen.getByTestId('paciente-salvar'));

    await waitFor(() =>
      expect(svc.criar).toHaveBeenCalledWith({
        nome: 'Ana Paula',
        email: 'ana@x.com',
        senha: '12345678',
      }),
    );
    expect(await screen.findByRole('header', { name: 'Pacientes' })).toBeOnTheScreen();
  });

  it('email duplicado (409)', async () => {
    svc.criar.mockRejectedValue(httpError(409));
    await abrirCadastro();
    await preencher('paciente-nome', 'Ana');
    await preencher('paciente-email', 'maria@x.com');
    await preencher('paciente-senha', '12345678');
    await fireEvent.press(screen.getByTestId('paciente-salvar'));

    expect(
      await screen.findByText('Já existe um paciente cadastrado com este email.'),
    ).toBeOnTheScreen();
  });
});

describe('Edição de paciente', () => {
  async function abrirEdicao() {
    await abrirAbaPacientes();
    await fireEvent.press(await screen.findByTestId('paciente-1'));
    await screen.findByText('Paciente desde 01/09/2026');
  }

  it('preenche o formulário com os dados do paciente', async () => {
    await abrirEdicao();

    expect(screen.getByTestId('paciente-nome')).toHaveDisplayValue('Maria Souza');
    expect(screen.getByTestId('paciente-dataNascimento')).toHaveDisplayValue('31/01/1990');
    expect(screen.getByRole('radio', { name: 'Feminino' })).toBeChecked();
    expect(screen.getByTestId('paciente-bairro')).toHaveDisplayValue('Centro');
    expect(screen.getByText('Nova senha')).toBeOnTheScreen();
  });

  it('salva sem senha (null), com a data convertida, e volta', async () => {
    await abrirEdicao();
    await preencher('paciente-dataNascimento', '15031985');
    await fireEvent.press(screen.getByRole('radio', { name: 'Não informado' }));
    await fireEvent.press(screen.getByTestId('paciente-salvar'));

    await waitFor(() => expect(svc.atualizar).toHaveBeenCalled());
    expect(svc.atualizar).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        nome: 'Maria Souza',
        senha: null,
        dataNascimento: '1985-03-15',
        sexo: null,
        profissao: 'Engenheira',
      }),
    );
    expect(await screen.findByRole('header', { name: 'Pacientes' })).toBeOnTheScreen();
  });

  it('data inválida não é enviada', async () => {
    await abrirEdicao();
    await preencher('paciente-dataNascimento', '31022000');
    await fireEvent.press(screen.getByTestId('paciente-salvar'));

    expect(screen.getByText('Data inválida. Use DD/MM/AAAA.')).toBeOnTheScreen();
    expect(svc.atualizar).not.toHaveBeenCalled();
  });

  it('mostra o histórico de consultas do paciente, que abre o prontuário', async () => {
    consultas.listarTodos.mockImplementation(async (pacienteId) =>
      pacienteId === 1
        ? [consulta({ id: 7, dataHora: '2026-09-10T14:30:00', status: 'REALIZADA' })]
        : [],
    );
    await abrirEdicao();

    const historico = await screen.findByTestId('paciente-consultas');
    expect(within(historico).getByText('10/09/2026 14:30 — Realizada')).toBeOnTheScreen();
    await fireEvent.press(within(historico).getByText('10/09/2026 14:30 — Realizada'));
    expect(await screen.findByText('O detalhe da consulta chega no Batch 5.')).toBeOnTheScreen();
  });

  it('atalhos levam para nova consulta e mensagens', async () => {
    await abrirEdicao();
    await fireEvent.press(screen.getByTestId('paciente-mensagens'));
    expect(await screen.findByTestId('chat-input')).toBeOnTheScreen();
    await waitFor(() => expect(mensagemService.listarPorPaciente).toHaveBeenCalledWith(1));
  });

  it('excluir pede confirmação; cancelar não chama a API', async () => {
    await abrirEdicao();
    await fireEvent.press(screen.getByTestId('paciente-excluir'));
    expect(
      await screen.findByText('Excluir este paciente? Essa ação não pode ser desfeita.'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('confirm-cancelar'));
    expect(svc.deletar).not.toHaveBeenCalled();
  });

  it('confirmar exclui e volta para a lista', async () => {
    await abrirEdicao();
    await fireEvent.press(screen.getByTestId('paciente-excluir'));
    await fireEvent.press(await screen.findByTestId('confirm-confirmar'));

    await waitFor(() => expect(svc.deletar).toHaveBeenCalledWith(1));
    expect(await screen.findByRole('header', { name: 'Pacientes' })).toBeOnTheScreen();
  });

  it('paciente com consultas ou mensagens (409): mensagem específica e continua na tela', async () => {
    svc.deletar.mockRejectedValue(httpError(409));
    await abrirEdicao();
    await fireEvent.press(screen.getByTestId('paciente-excluir'));
    await fireEvent.press(await screen.findByTestId('confirm-confirmar'));

    expect(
      await screen.findByText('Este paciente tem consultas ou mensagens e não pode ser excluído.'),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('paciente-nome')).toBeOnTheScreen();
  });
});
