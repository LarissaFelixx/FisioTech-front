import { fireEvent, render, screen } from '@testing-library/react-native';

import { MenuLateral } from '../../components/MenuLateral/MenuLateral';
import { AuthContext } from '../../contexts/AuthContext';
import { PacienteNavigator } from '../../navigation/PacienteNavigator';
import { meService } from '../../services/meService';
import { authValue, usuarioProfissional } from '../../test/authContextValue';
import { Providers } from '../../test/helpers';

jest.mock('../../services/meService');

const paciente = { ...usuarioProfissional, nome: 'Marcos Coelho', role: 'ROLE_PACIENTE' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(meService.minhasConversas).mockResolvedValue([]);
  jest.mocked(meService.perfil).mockResolvedValue({
    id: 5,
    nome: 'Marcos Coelho',
    email: 'marcos@x.com',
    profissionalId: null,
    profissionalNome: null,
    dataNascimento: null,
    sexo: null,
    profissao: null,
    telefone: null,
    endereco: null,
    bairro: null,
    foto: null,
    dataCriacao: '2025-03-12T10:00:00',
  });
});

async function montar() {
  const value = authValue({ user: paciente });
  await render(
    <Providers navigation>
      <AuthContext.Provider value={value}>
        <PacienteNavigator />
      </AuthContext.Provider>
    </Providers>,
  );
  return value;
}

describe('MenuLateral', () => {
  it('mostra iniciais, nome e papel; cada item fecha o menu e executa a ação', async () => {
    const onClose = jest.fn();
    const onLogout = jest.fn();
    const editar = jest.fn();
    await render(
      <MenuLateral
        visible
        nome="Marcos Coelho"
        papel="Paciente"
        onClose={onClose}
        onLogout={onLogout}
        items={[{ label: 'Editar Perfil', icon: 'user', onPress: editar }]}
      />,
    );

    expect(screen.getByText('MC')).toBeOnTheScreen();
    expect(screen.getByText('Marcos Coelho')).toBeOnTheScreen();
    expect(screen.getByText('Paciente')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Editar Perfil' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(editar).toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
    expect(onLogout).toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Fechar menu'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe('Navegação do paciente', () => {
  it('abre na Home com a saudação e tem as quatro abas do Figma', async () => {
    await montar();
    expect(await screen.findByText('Bem-vindo,')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Marcos Coelho' })).toBeOnTheScreen();
    for (const aba of ['home', 'consultas', 'mensagens', 'perfil']) {
      expect(screen.getByTestId(`tab-${aba}`)).toBeOnTheScreen();
    }
  });

  it('o avatar abre o menu; "Editar Perfil" leva à aba Perfil', async () => {
    await montar();
    await fireEvent.press(await screen.findByTestId('paciente-avatar'));
    expect(screen.getByTestId('menu-lateral')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('menu-editar-perfil'));
    expect(await screen.findByText('Cadastrado em 12/03/2025')).toBeOnTheScreen();
    expect(screen.queryByTestId('menu-lateral')).not.toBeOnTheScreen();
  });

  it('"Alterar Senha" abre a tela de troca de senha', async () => {
    await montar();
    await fireEvent.press(await screen.findByTestId('paciente-avatar'));
    await fireEvent.press(screen.getByTestId('menu-alterar-senha'));
    expect(
      await screen.findByText('A troca de senha chega com a atividade #45.'),
    ).toBeOnTheScreen();
  });

  it('"Sair" desloga', async () => {
    const value = await montar();
    await fireEvent.press(await screen.findByTestId('paciente-avatar'));
    await fireEvent.press(screen.getByTestId('menu-sair'));
    expect(value.logout).toHaveBeenCalled();
  });
});
