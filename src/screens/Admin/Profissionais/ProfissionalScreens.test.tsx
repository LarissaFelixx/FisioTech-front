import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import {
  CommonActions,
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';

import { ConfirmDialogProvider } from '../../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../../contexts/AuthContext';
import { AdminNavigator } from '../../../navigation/AdminNavigator';
import type { AdminStackParamList } from '../../../navigation/types';
import { profissionalService } from '../../../services/profissionalService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { httpError, networkError, Providers } from '../../../test/helpers';
import type { Profissional } from '../../../types/profissional';
import { EditarProfissionalScreen } from './EditarProfissionalScreen';
import { NovoProfissionalScreen } from './NovoProfissionalScreen';
import { ProfissionalListScreen } from './ProfissionalListScreen';

jest.mock('../../../services/profissionalService');
const service = jest.mocked(profissionalService);
const navigationRef = createNavigationContainerRef<AdminStackParamList>();
const profissional: Profissional = {
  id: 7,
  nome: 'Dra. Ana',
  email: 'ana@clinica.com',
  registroProfissional: 'CREFITO-123',
  especialidade: 'Ortopédica',
  valorConsultaParticular: 150,
  conveniosAceitos: ['Unimed'],
  foto: null,
  dataNascimento: '1990-01-31',
  sexo: 'Feminino',
  telefone: '85999999999',
  dataCriacao: '2026-10-01T10:00:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  service.listarTodos.mockResolvedValue([profissional]);
  service.buscarPorId.mockResolvedValue(profissional);
  service.criar.mockResolvedValue(undefined);
  service.atualizar.mockResolvedValue(undefined);
  service.deletar.mockResolvedValue(undefined);
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
  await fireEvent.press(await screen.findByTestId('admin-profissional-7'));
  await screen.findByTestId('admin-profissional-salvar');
  return view;
}

const preencher = (campo: string, valor: string) =>
  fireEvent.changeText(screen.getByTestId(`admin-profissional-${campo}`), valor);

describe('acesso exclusivo do ADM', () => {
  it('exige sessão autenticada mesmo quando o usuário contém o papel administrativo', async () => {
    await render(
      <AuthContext.Provider
        value={authValue({
          status: 'signedOut',
          user: { ...usuarioProfissional, role: 'ROLE_ADMIN' },
        })}
      >
        <AdminNavigator />
      </AuthContext.Provider>,
    );
    expect(screen.getByTestId('admin-access-denied')).toBeOnTheScreen();
    expect(service.listarTodos).not.toHaveBeenCalled();
  });

  it.each(['ROLE_PROFISSIONAL', 'ROLE_PACIENTE', 'ROLE_DESCONHECIDO'])(
    'bloqueia o navegador para %s sem consultar a API',
    async (role) => {
      await render(conteudo(role));
      expect(screen.getByTestId('admin-access-denied')).toBeOnTheScreen();
      expect(service.listarTodos).not.toHaveBeenCalled();
      expect(service.buscarPorId).not.toHaveBeenCalled();
    },
  );

  it.each([ProfissionalListScreen, NovoProfissionalScreen, EditarProfissionalScreen])(
    'bloqueia também a tela montada diretamente',
    async (Tela) => {
      await render(
        <AuthContext.Provider value={authValue()}>
          <Tela />
        </AuthContext.Provider>,
      );
      expect(screen.getByTestId('admin-access-denied')).toBeOnTheScreen();
      expect(service.listarTodos).not.toHaveBeenCalled();
      expect(service.buscarPorId).not.toHaveBeenCalled();
      expect(service.criar).not.toHaveBeenCalled();
    },
  );

  it('não executa uma correção confirmada depois da perda de acesso', async () => {
    const { rerender } = await abrirEdicao();
    await preencher('senha', 'nova-senha-123');
    await fireEvent.press(screen.getByTestId('admin-profissional-salvar'));
    await screen.findByTestId('confirm-confirmar');
    await rerender(conteudo('ROLE_PROFISSIONAL'));
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));
    expect(service.atualizar).not.toHaveBeenCalled();
  });
});

describe('lista administrativa', () => {
  it('oculta dados em cache e ações depois de uma resposta 403', async () => {
    await render(conteudo());
    await screen.findByTestId('admin-profissional-7');
    service.listarTodos.mockRejectedValueOnce(httpError(403));
    await fireEvent(screen.getByTestId('admin-profissionais-lista'), 'refresh');
    await screen.findByText('Você não tem permissão para administrar profissionais.');
    expect(screen.queryByTestId('admin-profissional-7')).toBeNull();
    expect(screen.queryByTestId('admin-profissional-novo')).toBeNull();
  });

  it('mostra e filtra identificação e especialidade sem nova consulta por tecla', async () => {
    await render(conteudo());
    expect(await screen.findByTestId('admin-profissional-7')).toBeOnTheScreen();
    expect(screen.getByText('R$ 150,00 · 1 convênio')).toBeOnTheScreen();
    await preencher('busca', 'ORTOPEDICA');
    expect(screen.getByTestId('admin-profissional-7')).toBeOnTheScreen();
    await preencher('busca', 'inexistente');
    expect(screen.getByText('Nenhum profissional encontrado para esta busca.')).toBeOnTheScreen();
    expect(service.listarTodos).toHaveBeenCalledTimes(1);
  });

  it('oferece nova tentativa em falha de rede', async () => {
    service.listarTodos.mockRejectedValueOnce(networkError());
    await render(conteudo());
    await fireEvent.press(await screen.findByText('Tentar novamente'));
    expect(await screen.findByTestId('admin-profissional-7')).toBeOnTheScreen();
  });

  it('exibe estado vazio e esconde os dados se o servidor negar acesso', async () => {
    service.listarTodos.mockResolvedValueOnce([]);
    await render(conteudo());
    expect(await screen.findByText('Nenhum profissional cadastrado.')).toBeOnTheScreen();
    service.listarTodos.mockRejectedValueOnce(httpError(403));
    await fireEvent(screen.getByTestId('admin-profissionais-lista'), 'refresh');
    expect(
      await screen.findByText('Você não tem permissão para administrar profissionais.'),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId('admin-profissional-novo')).toBeNull();
  });
});

describe('cadastro e correção administrativa', () => {
  it('mantém listagem, cadastro e edição em telas e rotas distintas', async () => {
    await render(conteudo());
    await screen.findByTestId('admin-profissional-7');
    expect(navigationRef.getCurrentRoute()?.name).toBe('Profissionais');
    expect(screen.queryByTestId('admin-editar-profissional')).toBeNull();

    await fireEvent.press(screen.getByTestId('admin-profissional-novo'));
    expect(navigationRef.getCurrentRoute()?.name).toBe('NovoProfissional');
    expect(screen.getByTestId('admin-novo-profissional')).toBeOnTheScreen();
    expect(screen.queryByTestId('admin-profissional-excluir')).toBeNull();
    expect(service.buscarPorId).not.toHaveBeenCalled();

    await act(async () => navigationRef.goBack());
    await fireEvent.press(await screen.findByTestId('admin-profissional-7'));
    await screen.findByTestId('admin-editar-profissional');
    expect(navigationRef.getCurrentRoute()?.name).toBe('EditarProfissional');
    expect(navigationRef.getCurrentRoute()?.params).toEqual({ id: 7 });
    expect(screen.getByTestId('admin-profissional-nome')).toHaveProp('value', 'Dra. Ana');
    expect(screen.getByText('Salvar alterações')).toBeOnTheScreen();
    expect(service.buscarPorId).toHaveBeenCalledWith(7);
    expect(service.criar).not.toHaveBeenCalled();
  });

  it.each([undefined, 0, -1])(
    'edição com id %s nunca abre cadastro nem consulta um perfil inválido',
    async (id) => {
      await render(conteudo());
      await screen.findByTestId('admin-profissional-7');
      await act(async () =>
        navigationRef.dispatch(
          CommonActions.navigate('EditarProfissional', id === undefined ? undefined : { id }),
        ),
      );
      expect(await screen.findByText('Profissional inválido. Volte à lista.')).toBeOnTheScreen();
      expect(screen.queryByTestId('admin-novo-profissional')).toBeNull();
      expect(screen.queryByTestId('admin-profissional-salvar')).toBeNull();
      expect(service.buscarPorId).not.toHaveBeenCalled();
      expect(service.criar).not.toHaveBeenCalled();
    },
  );

  it('não expõe o formulário se o servidor negar a consulta do perfil', async () => {
    service.buscarPorId.mockRejectedValueOnce(httpError(403));
    await render(conteudo());
    await fireEvent.press(await screen.findByTestId('admin-profissional-7'));
    await screen.findByText('Você não tem permissão para administrar profissionais.');
    expect(screen.queryByTestId('admin-profissional-salvar')).toBeNull();
    expect(screen.queryByTestId('admin-profissional-excluir')).toBeNull();
  });

  it('valida obrigatórios antes de enviar e cadastra todos os campos', async () => {
    await render(conteudo());
    await fireEvent.press(screen.getByTestId('admin-profissional-novo'));
    await fireEvent.press(screen.getByTestId('admin-profissional-salvar'));
    expect(service.criar).not.toHaveBeenCalled();
    await preencher('nome', 'Novo Profissional');
    await preencher('email', 'novo@clinica.com');
    await preencher('senha', 'senha-inicial-123');
    await preencher('registroProfissional', 'REG-123');
    await preencher('especialidade', 'Reabilitação');
    await preencher('valorConsultaParticular', '100,50');
    await preencher('conveniosAceitos', 'Unimed\nBradesco');
    await preencher('telefone', '85988887777');
    await fireEvent.press(screen.getByTestId('admin-profissional-salvar'));
    await waitFor(() =>
      expect(service.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Novo Profissional',
          senha: 'senha-inicial-123',
          valorConsultaParticular: 100.5,
          conveniosAceitos: ['Unimed', 'Bradesco'],
          telefone: '85988887777',
        }),
      ),
    );
    expect(await screen.findByTestId('admin-profissionais-lista')).toBeOnTheScreen();
  });

  it('corrige valor e contato, remove convênios e mantém a senha atual', async () => {
    await abrirEdicao();
    expect(screen.getByTestId('admin-profissional-dataNascimento')).toHaveProp(
      'value',
      '31/01/1990',
    );
    await preencher('valorConsultaParticular', '0');
    await preencher('conveniosAceitos', '');
    await preencher('telefone', '');
    await fireEvent.press(screen.getByTestId('admin-profissional-salvar'));
    await waitFor(() =>
      expect(service.atualizar).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          senha: null,
          valorConsultaParticular: 0,
          conveniosAceitos: [],
          telefone: null,
        }),
      ),
    );
  });

  it('confirma a sobrescrita de acesso sem mostrar a nova senha no diálogo', async () => {
    await abrirEdicao();
    await preencher('email', 'corrigido@clinica.com');
    await preencher('registroProfissional', 'CORRIGIDO-42');
    await preencher('senha', 'senha-corrigida-123');
    await fireEvent.press(screen.getByTestId('admin-profissional-salvar'));
    expect(await screen.findByText('Confirmar correção administrativa')).toBeOnTheScreen();
    expect(service.atualizar).not.toHaveBeenCalled();
    expect(screen.queryByText('senha-corrigida-123')).toBeNull();
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));
    await waitFor(() =>
      expect(service.atualizar).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          email: 'corrigido@clinica.com',
          registroProfissional: 'CORRIGIDO-42',
          senha: 'senha-corrigida-123',
        }),
      ),
    );
  });

  it('cancelar a confirmação não altera dados', async () => {
    await abrirEdicao();
    await preencher('email', 'outro@clinica.com');
    await fireEvent.press(screen.getByTestId('admin-profissional-salvar'));
    await fireEvent.press(screen.getByTestId('confirm-cancelar'));
    expect(service.atualizar).not.toHaveBeenCalled();
    expect(screen.getByTestId('admin-profissional-email')).toHaveProp('value', 'outro@clinica.com');
  });

  it('mantém dados digitados após conflito de email ou registro', async () => {
    service.atualizar.mockRejectedValueOnce(httpError(409));
    await abrirEdicao();
    await preencher('nome', 'Nome corrigido');
    await fireEvent.press(screen.getByTestId('admin-profissional-salvar'));
    expect(await screen.findByTestId('admin-profissional-erro')).toHaveTextContent(
      /Email ou registro profissional já cadastrado/,
    );
    expect(screen.getByTestId('admin-profissional-nome')).toHaveProp('value', 'Nome corrigido');
  });

  it('impede envios simultâneos e bloqueia edição enquanto aguarda', async () => {
    let terminar!: () => void;
    service.atualizar.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          terminar = resolve;
        }),
    );
    await abrirEdicao();
    await fireEvent.press(screen.getByTestId('admin-profissional-salvar'));
    await fireEvent.press(screen.getByTestId('admin-profissional-salvar'));
    expect(service.atualizar).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('admin-profissional-excluir')).toBeDisabled();
    expect(screen.getByTestId('admin-profissional-nome')).toHaveProp('editable', false);
    await act(async () => terminar());
    await screen.findByTestId('admin-profissionais-lista');
  });

  it('confirma exclusão e preserva o bloqueio de vínculos do backend', async () => {
    service.deletar.mockRejectedValueOnce(httpError(409));
    await abrirEdicao();
    await fireEvent.press(screen.getByTestId('admin-profissional-excluir'));
    await fireEvent.press(screen.getByTestId('confirm-cancelar'));
    expect(service.deletar).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('admin-profissional-excluir'));
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));
    expect(await screen.findByTestId('admin-profissional-erro')).toHaveTextContent(
      /registros vinculados/,
    );
    expect(screen.getByTestId('admin-profissional-salvar')).toBeOnTheScreen();
  });

  it('exclui perfil sem vínculos após confirmação e volta à lista', async () => {
    await abrirEdicao();
    await fireEvent.press(screen.getByTestId('admin-profissional-excluir'));
    await fireEvent.press(screen.getByTestId('confirm-confirmar'));
    await waitFor(() => expect(service.deletar).toHaveBeenCalledWith(7));
    expect(await screen.findByTestId('admin-profissionais-lista')).toBeOnTheScreen();
  });
});
