import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { consulta, httpError, paciente as pacienteMe, Providers } from '../../../test/helpers';
import { clock } from '../../../utils/clock';
import {
  consultasDoFiltro,
  linhaConsulta,
  mensagemListaVazia,
  ordenarConsultas,
} from './minhasConsultasLogic';

jest.mock('../../../services/meService');

const paciente = { ...usuarioProfissional, nome: 'Marcos Coelho', role: 'ROLE_PACIENTE' };

describe('regras de Minhas Consultas', () => {
  it('ordena das mais recentes para as mais antigas, sem alterar a lista original', () => {
    const lista = [
      consulta({ id: 1, dataHora: '2025-08-01T10:00:00' }),
      consulta({ id: 2, dataHora: '2025-08-22T09:00:00' }),
      consulta({ id: 3, dataHora: '2025-07-20T08:00:00' }),
      consulta({ id: 4, dataHora: '2025-08-15T15:00:00' }),
    ];
    expect(ordenarConsultas(lista).map((c) => c.id)).toEqual([2, 4, 1, 3]);
    expect(lista.map((c) => c.id)).toEqual([1, 2, 3, 4]);
  });

  it('monta a linha com data, hora, modalidade, convênio e se está cancelada', () => {
    expect(
      linhaConsulta(
        consulta({ dataHora: '2025-08-22T09:00:00', convenio: 'Unimed', status: 'CONFIRMADA' }),
      ),
    ).toEqual({ quando: '22/08/2025 09:00 · Presencial', convenio: 'Unimed', cancelada: false });
    expect(
      linhaConsulta(
        consulta({ dataHora: '2025-07-20T08:00:00', tipo: 'ONLINE', status: 'CANCELADA' }),
      ),
    ).toEqual({ quando: '20/07/2025 08:00 · Online', convenio: null, cancelada: true });
  });

  describe('filtro (S5-04)', () => {
    const agora = new Date(2025, 7, 21, 10, 0);
    const lista = [
      consulta({ id: 1, dataHora: '2025-08-29T09:00:00', status: 'AGENDADA' }),
      consulta({ id: 2, dataHora: '2025-08-22T09:00:00', status: 'CONFIRMADA' }),
      consulta({ id: 3, dataHora: '2025-08-01T10:00:00', status: 'REALIZADA' }),
      consulta({ id: 4, dataHora: '2025-08-25T08:00:00', status: 'CANCELADA' }),
      // Agendada que já passou sem ser realizada não é "próxima".
      consulta({ id: 5, dataHora: '2025-08-20T08:00:00', status: 'AGENDADA' }),
      consulta({ id: 6, dataHora: '2025-08-15T15:00:00', status: 'REALIZADA' }),
    ];
    const ids = (filtro: Parameters<typeof consultasDoFiltro>[1]) =>
      consultasDoFiltro(lista, filtro, agora).map((c) => c.id);

    it('"Todas" mantém todas, da mais recente para a mais antiga', () => {
      expect(ids('todas')).toEqual([1, 4, 2, 5, 6, 3]);
    });

    it('"Próximas" só agendadas/confirmadas por vir, da mais perto para a mais longe', () => {
      expect(ids('proximas')).toEqual([2, 1]);
    });

    it('"Realizadas" só as realizadas, da mais recente para a mais antiga', () => {
      expect(ids('realizadas')).toEqual([6, 3]);
    });

    it('mensagem de lista vazia por filtro', () => {
      expect(mensagemListaVazia('todas')).toBe('Você ainda não tem consultas.');
      expect(mensagemListaVazia('proximas')).toBe('Você não tem consultas marcadas.');
      expect(mensagemListaVazia('realizadas')).toBe('Você ainda não tem consultas realizadas.');
    });
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(clock, 'agora').mockReturnValue(new Date(2025, 7, 21, 10, 0));
  jest.mocked(meService.minhasConversas).mockResolvedValue([]);
  jest.mocked(meService.minhaConsulta).mockResolvedValue(consulta({ id: 2 }));
  jest.mocked(meService.perfil).mockResolvedValue(pacienteMe());
  jest.mocked(meService.buscarProfissionais).mockResolvedValue([]);
  jest.mocked(meService.minhasConsultas).mockResolvedValue([
    consulta({ id: 3, dataHora: '2025-08-01T10:00:00', tipo: 'ONLINE', status: 'REALIZADA' }),
    consulta({
      id: 1,
      dataHora: '2025-08-22T09:00:00',
      convenio: 'Unimed',
      status: 'CONFIRMADA',
    }),
    consulta({ id: 4, dataHora: '2025-07-20T08:00:00', status: 'CANCELADA' }),
    consulta({ id: 2, dataHora: '2025-08-15T15:00:00', status: 'REALIZADA' }),
  ]);
});

afterEach(() => jest.restoreAllMocks());

async function montarNaAba() {
  await render(
    <Providers navigation>
      <AuthContext.Provider value={authValue({ user: paciente })}>
        <ConfirmDialogProvider>
          <PacienteNavigator />
        </ConfirmDialogProvider>
      </AuthContext.Provider>
    </Providers>,
  );
  await fireEvent.press(screen.getByTestId('tab-consultas'));
}

describe('Minhas Consultas (#39)', () => {
  it('lista as consultas da mais recente para a mais antiga, com convênio e status', async () => {
    await montarNaAba();

    expect(screen.getByRole('header', { name: 'Minhas Consultas' })).toBeOnTheScreen();
    const lista = await screen.findByTestId('consultas-lista');
    const linhas = within(lista).getAllByRole('button');
    expect(linhas.map((l) => l.props.testID)).toEqual([
      'minha-consulta-1',
      'minha-consulta-2',
      'minha-consulta-3',
      'minha-consulta-4',
    ]);

    const primeira = within(screen.getByTestId('minha-consulta-1'));
    expect(primeira.getByText('22/08/2025 09:00 · Presencial')).toBeOnTheScreen();
    expect(primeira.getByText('Unimed')).toBeOnTheScreen();
    expect(primeira.getByText('Confirmada')).toBeOnTheScreen();
    expect(
      within(screen.getByTestId('minha-consulta-3')).getByText('01/08/2025 10:00 · Online'),
    ).toBeOnTheScreen();
    expect(within(screen.getByTestId('minha-consulta-4')).getByText('Cancelada')).toBeOnTheScreen();
  });

  it('a consulta cancelada aparece riscada', async () => {
    await montarNaAba();

    expect(await screen.findByText('20/07/2025 08:00 · Presencial')).toHaveStyle({
      textDecorationLine: 'line-through',
    });
    expect(screen.getByText('22/08/2025 09:00 · Presencial')).not.toHaveStyle({
      textDecorationLine: 'line-through',
    });
  });

  it('tocar numa consulta abre o detalhe dela', async () => {
    await montarNaAba();

    await fireEvent.press(await screen.findByTestId('minha-consulta-2'));
    expect(await screen.findByTestId('consulta-paciente')).toBeOnTheScreen();
  });

  it('"Marcar Consulta" abre a marcação', async () => {
    await montarNaAba();

    await fireEvent.press(screen.getByTestId('consultas-marcar'));
    expect(await screen.findByRole('header', { name: 'Marcar consulta' })).toBeOnTheScreen();
  });

  it('sem consultas, mantém o botão de marcar e avisa que a lista está vazia', async () => {
    jest.mocked(meService.minhasConsultas).mockResolvedValue([]);
    await montarNaAba();

    expect(await screen.findByText('Você ainda não tem consultas.')).toBeOnTheScreen();
    expect(screen.getByTestId('consultas-marcar')).toBeOnTheScreen();
  });

  it('o filtro mostra só as próximas ou só as realizadas', async () => {
    await montarNaAba();
    await screen.findByTestId('consultas-lista');

    await fireEvent.press(screen.getByTestId('consultas-filtro-proximas'));
    expect(screen.getByTestId('consultas-filtro-proximas')).toBeChecked();
    expect(
      within(screen.getByTestId('consultas-lista'))
        .getAllByRole('button')
        .map((l) => l.props.testID),
    ).toEqual(['minha-consulta-1']);

    await fireEvent.press(screen.getByTestId('consultas-filtro-realizadas'));
    expect(
      within(screen.getByTestId('consultas-lista'))
        .getAllByRole('button')
        .map((l) => l.props.testID),
    ).toEqual(['minha-consulta-2', 'minha-consulta-3']);

    await fireEvent.press(screen.getByTestId('consultas-filtro-todas'));
    expect(within(screen.getByTestId('consultas-lista')).getAllByRole('button')).toHaveLength(4);
  });

  it('filtro sem consultas mostra a mensagem dele', async () => {
    jest
      .mocked(meService.minhasConsultas)
      .mockResolvedValue([
        consulta({ id: 3, dataHora: '2025-08-01T10:00:00', status: 'REALIZADA' }),
      ]);
    await montarNaAba();
    await screen.findByTestId('consultas-lista');

    await fireEvent.press(screen.getByTestId('consultas-filtro-proximas'));
    expect(screen.getByTestId('consultas-vazio')).toHaveTextContent(
      'Você não tem consultas marcadas.',
    );
  });

  it('erro ao carregar mostra "Tentar novamente", que recarrega a lista', async () => {
    jest.mocked(meService.minhasConsultas).mockRejectedValue(httpError(500));
    await montarNaAba();

    expect(await screen.findByText('Não foi possível carregar suas consultas.')).toBeOnTheScreen();

    jest.mocked(meService.minhasConsultas).mockResolvedValue([consulta({ id: 9 })]);
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('minha-consulta-9')).toBeOnTheScreen();
  });
});
