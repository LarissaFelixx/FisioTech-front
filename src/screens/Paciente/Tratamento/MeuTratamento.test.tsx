import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { httpError, Providers } from '../../../test/helpers';
import type { EvolucaoClinica, PlanoTerapeutico } from '../../../types/prontuario';
import {
  MENSAGEM_SEM_REGISTROS,
  dataEvolucao,
  detalhesEvolucao,
  periodoPlano,
  planosAtuais,
} from './tratamentoLogic';

jest.mock('../../../services/meService');

const plano = (parcial: Partial<PlanoTerapeutico> = {}): PlanoTerapeutico => ({
  id: 1,
  pacienteId: 5,
  profissionalId: 3,
  profissionalNome: 'Ana Souza',
  revisao: 1,
  objetivos: 'Reduzir a dor e recuperar a amplitude completa do ombro.',
  condutas: 'Fortalecimento de manguito rotador, 2x/semana.',
  dataInicio: '2025-08-12',
  dataFimPrevista: '2025-09-30',
  status: 'ATIVO',
  visivelPaciente: true,
  dataCriacao: '2025-08-12T10:00:00',
  ...parcial,
});

const evolucao = (parcial: Partial<EvolucaoClinica> = {}): EvolucaoClinica => ({
  id: 10,
  pacienteId: 5,
  profissionalId: 3,
  profissionalNome: 'Ana Souza',
  consultaId: null,
  observacoes: 'Melhora da dor ao elevar o braço. Mantidos exercícios isométricos.',
  procedimentos: null,
  respostaPaciente: null,
  conduta: null,
  visivelPaciente: true,
  dataRegistro: '2025-08-22T15:30:00',
  ...parcial,
});

describe('tratamentoLogic', () => {
  it('mostra só a revisão mais recente de cada profissional', () => {
    const r1 = plano({ id: 1, revisao: 1, status: 'SUBSTITUIDO' });
    const r2 = plano({ id: 2, revisao: 2 });
    const outro = plano({ id: 3, profissionalId: 9, revisao: 1 });
    expect(planosAtuais([r2, r1, outro]).map((p) => p.id)).toEqual([2, 3]);
    expect(planosAtuais([r1, r2]).map((p) => p.id)).toEqual([2]);
    expect(planosAtuais([])).toEqual([]);
  });

  it('período: início e previsão (ou só o início)', () => {
    expect(periodoPlano(plano())).toBe('Início 12/08/2025 · Previsão 30/09/2025');
    expect(periodoPlano(plano({ dataFimPrevista: null }))).toBe('Início 12/08/2025');
  });

  it('evolução: data e só os detalhes preenchidos', () => {
    expect(dataEvolucao(evolucao())).toBe('22/08/2025');
    expect(detalhesEvolucao(evolucao())).toEqual([]);
    expect(
      detalhesEvolucao(evolucao({ conduta: 'Manter protocolo', procedimentos: 'TENS' })),
    ).toEqual([
      { rotulo: 'Procedimentos', valor: 'TENS' },
      { rotulo: 'Conduta', valor: 'Manter protocolo' },
    ]);
  });
});

describe('Meu Tratamento (tela)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(meService.minhasConversas).mockResolvedValue([]);
    jest.mocked(meService.meusPlanos).mockResolvedValue([plano()]);
    jest.mocked(meService.minhasEvolucoes).mockResolvedValue([evolucao()]);
  });

  async function abrir() {
    await render(
      <Providers navigation>
        <AuthContext.Provider
          value={authValue({ user: { ...usuarioProfissional, role: 'ROLE_PACIENTE' } })}
        >
          <PacienteNavigator />
        </AuthContext.Provider>
      </Providers>,
    );
    await fireEvent.press(await screen.findByTestId('home-meu-tratamento'));
    await screen.findByRole('header', { name: 'Meu tratamento' });
  }

  it('abre pela Home e mostra o plano e as evoluções do Figma', async () => {
    await abrir();
    const cartao = await screen.findByTestId('plano-1');
    expect(within(cartao).getByText('Plano terapêutico')).toBeOnTheScreen();
    expect(within(cartao).getByText('Ativo')).toBeOnTheScreen();
    expect(
      within(cartao).getByText('Reduzir a dor e recuperar a amplitude completa do ombro.'),
    ).toBeOnTheScreen();
    expect(
      within(cartao).getByText('Fortalecimento de manguito rotador, 2x/semana.'),
    ).toBeOnTheScreen();
    expect(within(cartao).getByText('Início 12/08/2025 · Previsão 30/09/2025')).toBeOnTheScreen();

    expect(screen.getByText('Evoluções')).toBeOnTheScreen();
    const ev = screen.getByTestId('evolucao-10');
    expect(within(ev).getByText('22/08/2025')).toBeOnTheScreen();
    expect(within(ev).getByText('Ana Souza')).toBeOnTheScreen();
  });

  it('sem nada compartilhado: mensagem de vazio', async () => {
    jest.mocked(meService.meusPlanos).mockResolvedValue([]);
    jest.mocked(meService.minhasEvolucoes).mockResolvedValue([]);
    await abrir();
    expect(await screen.findByText(MENSAGEM_SEM_REGISTROS)).toBeOnTheScreen();
    expect(screen.queryByText('Evoluções')).not.toBeOnTheScreen();
  });

  it('erro com "Tentar novamente"', async () => {
    jest.mocked(meService.minhasEvolucoes).mockRejectedValue(httpError(500));
    await abrir();
    expect(await screen.findByText('Não foi possível carregar seu tratamento.')).toBeOnTheScreen();
    jest.mocked(meService.minhasEvolucoes).mockResolvedValue([evolucao()]);
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('evolucao-10')).toBeOnTheScreen();
  });

  it('"‹ Home" volta para a Home', async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId('voltar'));
    expect(await screen.findByText('Bem-vindo,')).toBeOnTheScreen();
  });
});
