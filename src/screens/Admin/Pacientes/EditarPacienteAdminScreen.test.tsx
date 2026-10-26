import {
  CommonActions,
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../../contexts/AuthContext';
import { AdminNavigator } from '../../../navigation/AdminNavigator';
import type { AdminStackParamList } from '../../../navigation/types';
import { pacienteAdminService, pacienteService } from '../../../services/pacienteService';
import { profissionalService } from '../../../services/profissionalService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { httpError, networkError, Providers } from '../../../test/helpers';
import type { Paciente } from '../../../types/paciente';
import type { Profissional } from '../../../types/profissional';
import { EditarPacienteAdminScreen } from './EditarPacienteAdminScreen';

jest.mock('../../../services/pacienteService');
jest.mock('../../../services/profissionalService');
const service = jest.mocked(pacienteAdminService);
const profissionais = jest.mocked(profissionalService);
const navigationRef = createNavigationContainerRef<AdminStackParamList>();
const paciente: Paciente = {
  id: 12,
  nome: 'João Souza',
  email: 'joao@exemplo.com',
  profissionalId: 7,
  profissionalNome: 'Dra. Ana',
  dataNascimento: '1990-01-31',
  sexo: null,
  profissao: null,
  telefone: '85999999999',
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
  valorConsultaParticular: null,
  conveniosAceitos: [],
  foto: null,
  dataNascimento: null,
  sexo: null,
  telefone: null,
  dataCriacao: '2026-10-01T10:00:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  service.listarTodos.mockReset().mockResolvedValue([paciente]);
  service.buscarPorId.mockReset().mockResolvedValue(paciente);
  service.atualizar.mockReset().mockResolvedValue(undefined);
  profissionais.listarTodos
    .mockReset()
    .mockResolvedValue([
      profissional,
      { ...profissional, id: 8, nome: 'Dr. Bruno', registroProfissional: 'REG-8' },
    ]);
});

function conteudo(role = 'ROLE_ADMIN') {
  return (
    <Providers>
      <ConfirmDialogProvider>
        <AuthContext.Provider value={authValue({ user: { ...usuarioProfissional, role } })}>
          <NavigationContainer ref={navigationRef}>
            <AdminNavigator />
          </NavigationContainer>
        </AuthContext.Provider>
      </ConfirmDialogProvider>
    </Providers>
  );
}

async function abrirEdicao() {
  const view = await render(conteudo());
  await fireEvent.press(screen.getByTestId('admin-abrir-pacientes'));
  await fireEvent.press(await screen.findByTestId('admin-paciente-12'));
  await screen.findByTestId('admin-paciente-salvar');
  return view;
}

const preencher = (campo: string, valor: string) =>
  fireEvent.changeText(screen.getByTestId(`admin-paciente-${campo}`), valor);
const salvar = () => fireEvent.press(screen.getByTestId('admin-paciente-salvar'));

describe('Admin - Editar Paciente', () => {
  it.each(['ROLE_PACIENTE', 'ROLE_PROFISSIONAL', 'ROLE_DESCONHECIDO'])(
    'bloqueia montagem direta para %s sem executar hooks protegidos',
    async (role) => {
      await render(
        <AuthContext.Provider value={authValue({ user: { ...usuarioProfissional, role } })}>
          <EditarPacienteAdminScreen />
        </AuthContext.Provider>,
      );
      expect(screen.getByTestId('admin-access-denied')).toBeOnTheScreen();
      expect(service.buscarPorId).not.toHaveBeenCalled();
      expect(profissionais.listarTodos).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, 0, -1, 1.5])('recusa id %s sem consultar o paciente', async (id) => {
    await render(conteudo());
    await act(async () =>
      navigationRef.dispatch(
        CommonActions.navigate('EditarPaciente', id === undefined ? undefined : { id }),
      ),
    );
    expect(await screen.findByText('Paciente inválido. Volte à lista.')).toBeOnTheScreen();
    expect(service.buscarPorId).not.toHaveBeenCalled();
    expect(screen.queryByTestId('admin-paciente-salvar')).toBeNull();
  });

  it('abre uma rota distinta pelo card, salva somente o contrato administrativo e atualiza a lista', async () => {
    await abrirEdicao();
    expect(navigationRef.getCurrentRoute()).toEqual(
      expect.objectContaining({ name: 'EditarPaciente', params: { id: 12 } }),
    );
    expect(screen.getByTestId('admin-paciente-nome')).toHaveProp('value', paciente.nome);
    expect(screen.getByText('Nascimento: 31/01/1990')).toBeOnTheScreen();
    await preencher('nome', ' João Corrigido ');
    service.listarTodos.mockResolvedValue([{ ...paciente, nome: 'João Corrigido' }]);
    await salvar();
    await waitFor(() =>
      expect(service.atualizar).toHaveBeenCalledWith(12, {
        nome: 'João Corrigido',
        email: 'joao@exemplo.com',
        senha: null,
        profissionalId: 7,
      }),
    );
    expect(await screen.findByText('João Corrigido')).toBeOnTheScreen();
    expect(navigationRef.getCurrentRoute()?.name).toBe('Pacientes');
    expect(pacienteService.atualizar).not.toHaveBeenCalled();
    expect(pacienteService.deletar).not.toHaveBeenCalled();
    expect(pacienteService.criar).not.toHaveBeenCalled();
  });

  it('valida nome, email e senha antes de enviar', async () => {
    await abrirEdicao();
    await preencher('nome', ' ');
    await preencher('email', 'email-invalido');
    await preencher('senha', 'curta');
    await salvar();
    expect(service.atualizar).not.toHaveBeenCalled();
    expect(screen.getByText('Este campo é obrigatório.')).toBeOnTheScreen();
    expect(screen.getByText('Email inválido.')).toBeOnTheScreen();
    expect(screen.getByText('Deve ter pelo menos 8 caracteres.')).toBeOnTheScreen();
  });

  it('exige escolher um responsável para paciente sem vínculo', async () => {
    service.buscarPorId.mockResolvedValueOnce({
      ...paciente,
      profissionalId: null,
      profissionalNome: null,
    });
    await abrirEdicao();
    await salvar();
    expect(service.atualizar).not.toHaveBeenCalled();
    expect(screen.getByText('Este campo é obrigatório.')).toBeOnTheScreen();
  });

  it('busca e seleciona responsável e confirma as correções sem exibir a senha', async () => {
    await abrirEdicao();
    await fireEvent.press(screen.getByTestId('admin-paciente-responsavel'));
    await fireEvent.changeText(screen.getByTestId('admin-paciente-responsavel-busca'), 'BRUNO');
    expect(screen.queryByTestId('admin-paciente-responsavel-7')).toBeNull();
    await fireEvent.press(screen.getByTestId('admin-paciente-responsavel-8'));
    await preencher('email', 'corrigido@exemplo.com');
    await preencher('senha', 'senha-corrigida-123');
    await salvar();
    await screen.findByText('Confirmar correção administrativa');
    expect(service.atualizar).not.toHaveBeenCalled();
    expect(screen.queryByText('senha-corrigida-123')).toBeNull();
    expect(screen.getByTestId('admin-paciente-responsavel')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));
    await waitFor(() =>
      expect(service.atualizar).toHaveBeenCalledWith(12, {
        nome: paciente.nome,
        email: 'corrigido@exemplo.com',
        senha: 'senha-corrigida-123',
        profissionalId: 8,
      }),
    );
  });

  it('cancelar a confirmação preserva os campos sem alterar o paciente', async () => {
    await abrirEdicao();
    await preencher('email', 'outro@exemplo.com');
    await salvar();
    await fireEvent.press(screen.getByTestId('confirm-cancelar'));
    expect(service.atualizar).not.toHaveBeenCalled();
    expect(screen.getByTestId('admin-paciente-email')).toHaveProp('value', 'outro@exemplo.com');
    expect(screen.getByTestId('admin-paciente-nome')).toHaveProp('editable', true);
  });

  it.each([httpError(400), httpError(403), httpError(404), httpError(409), networkError()])(
    'preserva alterações em uma operação recusada %#',
    async (erro) => {
      service.atualizar.mockRejectedValueOnce(erro);
      await abrirEdicao();
      await preencher('nome', 'Nome corrigido');
      await salvar();
      expect(await screen.findByTestId('admin-paciente-erro')).toBeOnTheScreen();
      expect(screen.getByTestId('admin-paciente-nome')).toHaveProp('value', 'Nome corrigido');
      expect(screen.getByTestId('admin-paciente-nome')).toHaveProp('editable', true);
    },
  );

  it('oferece nova tentativa ao carregar e oculta formulário quando o servidor nega acesso', async () => {
    service.buscarPorId.mockRejectedValueOnce(networkError()).mockRejectedValueOnce(httpError(403));
    await render(conteudo());
    await fireEvent.press(screen.getByTestId('admin-abrir-pacientes'));
    await fireEvent.press(await screen.findByTestId('admin-paciente-12'));
    await fireEvent.press(await screen.findByText('Tentar novamente'));
    await screen.findByText('Você não tem permissão para administrar pacientes.');
    expect(screen.queryByTestId('admin-paciente-salvar')).toBeNull();
  });

  it('permite recuperar falha na consulta de profissionais', async () => {
    profissionais.listarTodos
      .mockResolvedValueOnce([profissional])
      .mockRejectedValueOnce(networkError());
    await render(conteudo());
    await screen.findByText('Dra. Ana');
    await fireEvent.press(screen.getByTestId('admin-abrir-pacientes'));
    await fireEvent.press(await screen.findByTestId('admin-paciente-12'));
    await screen.findByText('Não foi possível carregar os profissionais responsáveis.');
    expect(screen.queryByTestId('admin-paciente-salvar')).toBeNull();
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('admin-paciente-salvar')).toBeOnTheScreen();
  });

  it('impede salvar sem profissionais disponíveis', async () => {
    profissionais.listarTodos.mockResolvedValue([]);
    await abrirEdicao();
    await salvar();
    expect(service.atualizar).not.toHaveBeenCalled();
    expect(screen.getByText('Selecione um profissional disponível.')).toBeOnTheScreen();
  });

  it('bloqueia envios simultâneos', async () => {
    let terminar!: () => void;
    service.atualizar.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          terminar = resolve;
        }),
    );
    await abrirEdicao();
    await salvar();
    await salvar();
    expect(service.atualizar).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('admin-paciente-nome')).toHaveProp('editable', false);
    await act(async () => terminar());
    await screen.findByTestId('admin-pacientes-lista');
  });

  it('não envia correção confirmada depois da perda de acesso', async () => {
    const { rerender } = await abrirEdicao();
    await preencher('senha', 'nova-senha-123');
    await salvar();
    await screen.findByTestId('confirm-confirmar');
    await rerender(conteudo('ROLE_PROFISSIONAL'));
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));
    expect(service.atualizar).not.toHaveBeenCalled();
    expect(screen.queryByTestId('admin-editar-paciente')).toBeNull();
  });
});
