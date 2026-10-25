import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { consulta, httpError, paciente as pacienteMe, Providers } from '../../../test/helpers';
import { linhaConsulta, ordenarConsultas } from './minhasConsultasLogic';

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
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(meService.minhasConversas).mockResolvedValue([]);
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

async function montarNaAba() {
  await render(
    <Providers navigation>
      <AuthContext.Provider value={authValue({ user: paciente })}>
        <PacienteNavigator />
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
    expect(
      await screen.findByText('O detalhe da consulta chega com a atividade #41.'),
    ).toBeOnTheScreen();
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

  it('erro ao carregar mostra "Tentar novamente", que recarrega a lista', async () => {
    jest.mocked(meService.minhasConsultas).mockRejectedValue(httpError(500));
    await montarNaAba();

    expect(await screen.findByText('Não foi possível carregar suas consultas.')).toBeOnTheScreen();

    jest.mocked(meService.minhasConsultas).mockResolvedValue([consulta({ id: 9 })]);
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('minha-consulta-9')).toBeOnTheScreen();
  });
});
