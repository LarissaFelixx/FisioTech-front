import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AuthContext } from '../../../contexts/AuthContext';
import { AdminNavigator } from '../../../navigation/AdminNavigator';
import { pacienteAdminService, pacienteService } from '../../../services/pacienteService';
import { profissionalService } from '../../../services/profissionalService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { httpError, networkError, Providers } from '../../../test/helpers';
import type { Paciente } from '../../../types/paciente';
import { PacienteAdminListScreen } from './PacienteAdminListScreen';

jest.mock('../../../services/pacienteService');
jest.mock('../../../services/profissionalService');
const service = jest.mocked(pacienteAdminService);
const paciente: Paciente = {
  id: 12,
  nome: 'João Souza',
  email: 'joao@exemplo.com',
  profissionalId: 7,
  profissionalNome: 'Dra. Ana',
  telefone: '85999999999',
  dataNascimento: null,
  sexo: null,
  profissao: null,
  endereco: null,
  bairro: null,
  foto: null,
  dataCriacao: '2026-10-01T10:00:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  service.listarTodos.mockResolvedValue([paciente]);
  jest.mocked(profissionalService.listarTodos).mockResolvedValue([]);
});

function conteudo(role = 'ROLE_ADMIN') {
  return (
    <Providers>
      <AuthContext.Provider value={authValue({ user: { ...usuarioProfissional, role } })}>
        <NavigationContainer>
          <AdminNavigator />
        </NavigationContainer>
      </AuthContext.Provider>
    </Providers>
  );
}

async function abrirLista() {
  const view = await render(conteudo());
  await fireEvent.press(screen.getByTestId('admin-abrir-pacientes'));
  return view;
}

describe('Admin - Pacientes', () => {
  it.each(['ROLE_PROFISSIONAL', 'ROLE_PACIENTE', 'ROLE_DESCONHECIDO'])(
    'bloqueia a montagem direta para %s antes de consultar dados',
    async (role) => {
      await render(
        <AuthContext.Provider value={authValue({ user: { ...usuarioProfissional, role } })}>
          <PacienteAdminListScreen />
        </AuthContext.Provider>,
      );
      expect(screen.getByTestId('admin-access-denied')).toBeOnTheScreen();
      expect(service.listarTodos).not.toHaveBeenCalled();
    },
  );

  it('bloqueia sessão encerrada mesmo com papel administrativo', async () => {
    await render(
      <AuthContext.Provider
        value={authValue({
          status: 'signedOut',
          user: { ...usuarioProfissional, role: 'ROLE_ADMIN' },
        })}
      >
        <PacienteAdminListScreen />
      </AuthContext.Provider>,
    );
    expect(screen.getByTestId('admin-access-denied')).toBeOnTheScreen();
    expect(service.listarTodos).not.toHaveBeenCalled();
  });

  it('abre pela administração e filtra por nome, email e profissional sem novas consultas', async () => {
    await abrirLista();
    expect(await screen.findByTestId('admin-paciente-12')).toBeOnTheScreen();
    expect(screen.getByText('Profissional: Dra. Ana')).toBeOnTheScreen();
    expect(screen.getByText('1 de 1 pacientes')).toBeOnTheScreen();
    for (const termo of ['JOAO', 'joao@exemplo', 'DRA. ANA']) {
      await fireEvent.changeText(screen.getByTestId('admin-paciente-busca'), termo);
      expect(screen.getByTestId('admin-paciente-12')).toBeOnTheScreen();
    }
    await fireEvent.changeText(screen.getByTestId('admin-paciente-busca'), 'inexistente');
    expect(screen.queryByTestId('admin-paciente-12')).toBeNull();
    expect(screen.getByText('Nenhum paciente encontrado para esta busca.')).toBeOnTheScreen();
    expect(service.listarTodos).toHaveBeenCalledTimes(1);
    expect(pacienteService.listarTodos).not.toHaveBeenCalled();
  });

  it('exibe pacientes sem profissional e estado vazio', async () => {
    service.listarTodos.mockResolvedValueOnce([
      { ...paciente, profissionalId: null, profissionalNome: null },
    ]);
    await abrirLista();
    expect(await screen.findByText('Profissional: Não vinculado')).toBeOnTheScreen();
    service.listarTodos.mockResolvedValueOnce([]);
    await fireEvent(screen.getByTestId('admin-pacientes-lista'), 'refresh');
    expect(await screen.findByText('Nenhum paciente cadastrado.')).toBeOnTheScreen();
  });

  it('permite tentar novamente após falha de rede', async () => {
    service.listarTodos.mockRejectedValueOnce(networkError());
    await abrirLista();
    await fireEvent.press(await screen.findByText('Tentar novamente'));
    expect(await screen.findByTestId('admin-paciente-12')).toBeOnTheScreen();
  });

  it('oculta dados em cache e busca após acesso negado na atualização', async () => {
    await abrirLista();
    await screen.findByTestId('admin-paciente-12');
    service.listarTodos.mockRejectedValueOnce(httpError(403));
    await fireEvent(screen.getByTestId('admin-pacientes-lista'), 'refresh');
    await screen.findByText('Você não tem permissão para administrar pacientes.');
    expect(screen.queryByTestId('admin-paciente-12')).toBeNull();
    expect(screen.queryByTestId('admin-paciente-busca')).toBeNull();
    expect(screen.queryByTestId('admin-pacientes-total')).toBeNull();
  });

  it('mantém dados anteriores em falha temporária e remove a tela na perda do papel ADM', async () => {
    const { rerender } = await abrirLista();
    await screen.findByTestId('admin-paciente-12');
    service.listarTodos.mockRejectedValueOnce(networkError());
    await fireEvent(screen.getByTestId('admin-pacientes-lista'), 'refresh');
    await screen.findByText('Tentar novamente');
    expect(screen.getByTestId('admin-paciente-12')).toBeOnTheScreen();
    await rerender(conteudo('ROLE_PROFISSIONAL'));
    expect(screen.queryByTestId('admin-paciente-12')).toBeNull();
    expect(screen.getByTestId('admin-access-denied')).toBeOnTheScreen();
  });
});
