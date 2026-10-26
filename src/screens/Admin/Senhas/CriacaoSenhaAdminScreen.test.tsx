import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../../contexts/AuthContext';
import { AdminNavigator } from '../../../navigation/AdminNavigator';
import { pacienteAdminService, pacienteService } from '../../../services/pacienteService';
import { adminService, profissionalService } from '../../../services/profissionalService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { httpError, networkError, Providers } from '../../../test/helpers';
import type { Paciente } from '../../../types/paciente';
import type { Profissional } from '../../../types/profissional';
import { CriacaoSenhaAdminScreen } from './CriacaoSenhaAdminScreen';

jest.mock('../../../services/pacienteService');
jest.mock('../../../services/profissionalService');
const pacientes = jest.mocked(pacienteAdminService);
const profissionais = jest.mocked(profissionalService);
const paciente: Paciente = {
  id: 12,
  nome: 'João Souza',
  email: 'joao@exemplo.com',
  profissionalId: 7,
  profissionalNome: 'Dra. Ana',
  dataNascimento: null,
  sexo: null,
  profissao: null,
  telefone: null,
  endereco: null,
  bairro: null,
  foto: null,
  dataCriacao: '2026-10-01T10:00:00',
};
const profissional: Profissional = {
  id: 7,
  nome: 'Dra. Ana',
  email: 'ana@clinica.com',
  registroProfissional: 'REG-7',
  especialidade: 'Ortopédica',
  valorConsultaParticular: 123.45,
  conveniosAceitos: ['Unimed', 'UNIMED'],
  foto: 'https://exemplo.com/foto.jpg',
  dataNascimento: '1990-01-31',
  sexo: 'Feminino',
  telefone: '85999999999',
  dataCriacao: '2026-10-01T10:00:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  pacientes.listarTodos.mockReset().mockResolvedValue([paciente]);
  pacientes.buscarPorId.mockReset().mockResolvedValue(paciente);
  pacientes.atualizar.mockReset().mockResolvedValue(undefined);
  profissionais.listarTodos.mockReset().mockResolvedValue([profissional]);
  profissionais.buscarPorId.mockReset().mockResolvedValue(profissional);
  profissionais.atualizar.mockReset().mockResolvedValue(undefined);
});

const autenticacao = authValue({ user: { ...usuarioProfissional, role: 'ROLE_ADMIN' } });
function conteudo(role = 'ROLE_ADMIN') {
  return (
    <Providers>
      <ConfirmDialogProvider>
        <AuthContext.Provider value={{ ...autenticacao, user: { ...usuarioProfissional, role } }}>
          <NavigationContainer>
            <AdminNavigator />
          </NavigationContainer>
        </AuthContext.Provider>
      </ConfirmDialogProvider>
    </Providers>
  );
}

async function abrir(tipo: 'paciente' | 'profissional' = 'paciente') {
  const view = await render(conteudo());
  await fireEvent.press(screen.getByTestId('admin-abrir-criacao-senha'));
  if (tipo === 'profissional') {
    await fireEvent.press(screen.getByTestId('admin-senha-tipo-profissional'));
  }
  await fireEvent.press(
    await screen.findByTestId(`admin-senha-conta-${tipo === 'paciente' ? 12 : 7}`),
  );
  return view;
}

async function preencher(senha = 'nova-senha-123', confirmacao = senha) {
  await fireEvent.changeText(screen.getByTestId('admin-senha-nova'), senha);
  await fireEvent.changeText(screen.getByTestId('admin-senha-confirmacao'), confirmacao);
}
const salvar = () => fireEvent.press(screen.getByTestId('admin-senha-salvar'));

describe('Admin - Criação de senha de outras contas', () => {
  it.each(['ROLE_PROFISSIONAL', 'ROLE_PACIENTE', 'ROLE_DESCONHECIDO'])(
    'bloqueia a montagem direta para %s sem consultar contas',
    async (role) => {
      await render(
        <AuthContext.Provider value={authValue({ user: { ...usuarioProfissional, role } })}>
          <CriacaoSenhaAdminScreen />
        </AuthContext.Provider>,
      );
      expect(screen.getByTestId('admin-access-denied')).toBeOnTheScreen();
      expect(pacientes.listarTodos).not.toHaveBeenCalled();
      expect(profissionais.listarTodos).not.toHaveBeenCalled();
    },
  );

  it('exige sessão autenticada mesmo com papel administrativo', async () => {
    await render(
      <AuthContext.Provider
        value={authValue({
          status: 'signedOut',
          user: { ...usuarioProfissional, role: 'ROLE_ADMIN' },
        })}
      >
        <CriacaoSenhaAdminScreen />
      </AuthContext.Provider>,
    );
    expect(screen.getByTestId('admin-access-denied')).toBeOnTheScreen();
    expect(pacientes.listarTodos).not.toHaveBeenCalled();
  });

  it('busca por nome sem acentos ou email e mostra estado vazio sem novas chamadas', async () => {
    await render(conteudo());
    await fireEvent.press(screen.getByTestId('admin-abrir-criacao-senha'));
    await screen.findByTestId('admin-senha-conta-12');
    for (const termo of ['JOAO', 'joao@exemplo']) {
      await fireEvent.changeText(screen.getByTestId('admin-senha-busca'), termo);
      expect(screen.getByTestId('admin-senha-conta-12')).toBeOnTheScreen();
    }
    await fireEvent.changeText(screen.getByTestId('admin-senha-busca'), 'ausente');
    expect(screen.getByText('Nenhuma conta encontrada para esta busca.')).toBeOnTheScreen();
    expect(pacientes.listarTodos).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['', ''],
    ['curta', 'curta'],
    ['nova-senha-123', 'diferente'],
  ])('valida senha e confirmação antes de buscar perfil (%s)', async (senha, confirmacao) => {
    await abrir();
    await preencher(senha, confirmacao);
    await salvar();
    expect(pacientes.buscarPorId).not.toHaveBeenCalled();
    expect(pacientes.atualizar).not.toHaveBeenCalled();
    expect(screen.getByTestId('admin-senha-nova')).toHaveProp('secureTextEntry', true);
    expect(screen.getByTestId('admin-senha-confirmacao')).toHaveProp('secureTextEntry', true);
  });

  it('reconsulta o paciente, confirma a conta e mantém seus dados mais recentes e a sessão ADM', async () => {
    await abrir();
    pacientes.buscarPorId.mockResolvedValueOnce({
      ...paciente,
      nome: 'Nome atualizado',
      email: 'atual@exemplo.com',
      profissionalId: 9,
    });
    await preencher();
    await salvar();
    await screen.findByText(/Nome atualizado \(atual@exemplo.com\)/);
    expect(screen.queryByText('nova-senha-123')).toBeNull();
    expect(pacientes.atualizar).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));
    expect(await screen.findByTestId('admin-senha-sucesso')).toBeOnTheScreen();
    expect(pacientes.atualizar).toHaveBeenCalledWith(12, {
      nome: 'Nome atualizado',
      email: 'atual@exemplo.com',
      profissionalId: 9,
      senha: 'nova-senha-123',
    });
    expect(autenticacao.login).not.toHaveBeenCalled();
    expect(autenticacao.logout).not.toHaveBeenCalled();
    expect(adminService.alterarPropriaSenha).not.toHaveBeenCalled();
    expect(pacienteService.atualizar).not.toHaveBeenCalled();
    expect(screen.queryByTestId('admin-senha-nova')).toBeNull();
    await fireEvent.press(screen.getByTestId('admin-senha-outra-conta'));
    await fireEvent.press(await screen.findByTestId('admin-senha-conta-12'));
    expect(screen.getByTestId('admin-senha-nova')).toHaveProp('value', '');
    expect(screen.getByTestId('admin-senha-confirmacao')).toHaveProp('value', '');
  });

  it('preserva exatamente os campos atuais do profissional no PUT', async () => {
    await abrir('profissional');
    await preencher(' senha-nova-123 ');
    await salvar();
    await fireEvent.press(await screen.findByTestId('confirm-confirmar'));
    await screen.findByTestId('admin-senha-sucesso');
    const { id: _id, dataCriacao: _dataCriacao, ...campos } = profissional;
    expect(profissionais.atualizar).toHaveBeenCalledWith(7, {
      ...campos,
      senha: ' senha-nova-123 ',
    });
    expect(pacientes.atualizar).not.toHaveBeenCalled();
    expect(profissionalService.alterarPropriaSenha).not.toHaveBeenCalled();
  });

  it('não modifica vínculo de paciente sem responsável nem tenta gravar', async () => {
    pacientes.buscarPorId.mockResolvedValueOnce({ ...paciente, profissionalId: null });
    await abrir();
    await preencher();
    await salvar();
    expect(await screen.findByTestId('admin-senha-erro')).toHaveTextContent(
      /Defina o profissional responsável/,
    );
    expect(pacientes.atualizar).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirm-confirmar')).toBeNull();
  });

  it('cancelar a confirmação preserva a senha digitada sem gravar', async () => {
    await abrir();
    await preencher();
    await salvar();
    await fireEvent.press(await screen.findByTestId('confirm-cancelar'));
    expect(pacientes.atualizar).not.toHaveBeenCalled();
    expect(screen.getByTestId('admin-senha-nova')).toHaveProp('value', 'nova-senha-123');
    expect(screen.getByTestId('admin-senha-nova')).toHaveProp('editable', true);
  });

  it.each([httpError(400), httpError(403), httpError(404), httpError(409), networkError()])(
    'trata recusa da gravação sem perder os campos %#',
    async (erro) => {
      pacientes.atualizar.mockRejectedValueOnce(erro);
      await abrir();
      await preencher();
      await salvar();
      await fireEvent.press(await screen.findByTestId('confirm-confirmar'));
      expect(await screen.findByTestId('admin-senha-erro')).toBeOnTheScreen();
      expect(screen.getByTestId('admin-senha-nova')).toHaveProp('value', 'nova-senha-123');
      expect(screen.getByTestId('admin-senha-nova')).toHaveProp('editable', true);
      expect(screen.queryByTestId('admin-senha-sucesso')).toBeNull();
    },
  );

  it('não grava se a consulta atualizada falhar', async () => {
    pacientes.buscarPorId.mockRejectedValueOnce(httpError(404));
    await abrir();
    await preencher();
    await salvar();
    await screen.findByTestId('admin-senha-erro');
    expect(pacientes.atualizar).not.toHaveBeenCalled();
  });

  it('oferece nova tentativa na listagem e oculta contas após 403', async () => {
    pacientes.listarTodos.mockRejectedValueOnce(networkError());
    await render(conteudo());
    await fireEvent.press(screen.getByTestId('admin-abrir-criacao-senha'));
    await fireEvent.press(await screen.findByText('Tentar novamente'));
    await screen.findByTestId('admin-senha-conta-12');
    pacientes.listarTodos.mockRejectedValueOnce(httpError(403));
    await fireEvent(screen.getByTestId('admin-senha-contas'), 'refresh');
    await screen.findByText('Você não tem permissão para definir senhas destas contas.');
    expect(screen.queryByTestId('admin-senha-conta-12')).toBeNull();
  });

  it('bloqueia envio repetido e troca de conta durante a operação', async () => {
    let terminar!: () => void;
    pacientes.atualizar.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          terminar = resolve;
        }),
    );
    await abrir();
    await preencher();
    await salvar();
    await fireEvent.press(await screen.findByTestId('confirm-confirmar'));
    await salvar();
    await waitFor(() => expect(pacientes.atualizar).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('admin-senha-outra-conta')).toBeDisabled();
    expect(screen.getByTestId('admin-senha-nova')).toHaveProp('editable', false);
    await act(async () => terminar());
    await screen.findByTestId('admin-senha-sucesso');
  });

  it('não grava uma confirmação resolvida após perder o papel ADM', async () => {
    const { rerender } = await abrir();
    await preencher();
    await salvar();
    await screen.findByTestId('confirm-confirmar');
    await rerender(conteudo('ROLE_PACIENTE'));
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));
    expect(pacientes.atualizar).not.toHaveBeenCalled();
  });
});
