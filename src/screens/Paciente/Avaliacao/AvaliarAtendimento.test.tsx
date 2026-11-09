import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import type { PacienteStackParamList } from '../../../navigation/types';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { consulta, httpError, Providers } from '../../../test/helpers';
import type { Avaliacao } from '../../../types/avaliacao';
import { AvaliarAtendimentoScreen } from './AvaliarAtendimentoScreen';
import {
  mensagemErroAvaliar,
  montarAvaliacao,
  situacaoAvaliacao,
  statusErroAvaliar,
  subtituloAvaliacao,
  textoNota,
} from './avaliacaoLogic';

jest.mock('../../../services/meService');

const realizada = consulta({
  id: 8,
  profissionalNome: 'Ana Souza',
  dataHora: '2025-08-15T15:00:00',
  status: 'REALIZADA',
});

describe('avaliacaoLogic', () => {
  it('texto da nota como no Figma ("4 de 5 · Muito bom")', () => {
    expect(textoNota(4)).toBe('4 de 5 · Muito bom');
    expect(textoNota(5)).toBe('5 de 5 · Excelente');
    expect(textoNota(1)).toBe('1 de 5 · Ruim');
    expect(textoNota(null)).toBe('Toque nas estrelas para dar sua nota');
  });

  it('subtítulo com profissional, data e hora', () => {
    expect(subtituloAvaliacao(realizada)).toBe('Ana Souza · 15/08/2025 15:00');
  });

  it('comentário em branco vai como null', () => {
    expect(montarAvaliacao(8, 4, '  ')).toEqual({ consultaId: 8, nota: 4, comentario: null });
    expect(montarAvaliacao(8, 5, ' Ótimo ')).toEqual({
      consultaId: 8,
      nota: 5,
      comentario: 'Ótimo',
    });
  });

  it('mensagens de erro do backend', () => {
    expect(mensagemErroAvaliar(httpError(409))).toBe('Esta consulta já foi avaliada.');
    expect(mensagemErroAvaliar(httpError(400))).toBe(
      'Só é possível avaliar consultas já realizadas.',
    );
    expect(mensagemErroAvaliar(httpError(500))).toBe('Não foi possível enviar a avaliação.');
    expect(statusErroAvaliar(httpError(409))).toBe(409);
    expect(statusErroAvaliar(new Error('x'))).toBeNull();
  });

  it('só libera consulta realizada e ainda sem avaliação (S5-05)', () => {
    const avaliacao = {
      id: 1,
      consultaId: 8,
      nota: 5,
      comentario: null,
      dataCriacao: '2025-08-16T10:00:00',
    };
    expect(situacaoAvaliacao(realizada, null)).toBe('liberada');
    expect(situacaoAvaliacao(realizada, avaliacao)).toBe('ja-avaliada');
    for (const status of ['AGENDADA', 'CONFIRMADA', 'CANCELADA'] as const) {
      expect(situacaoAvaliacao({ ...realizada, status }, null)).toBe('nao-realizada');
    }
  });
});

describe('Avaliar Atendimento (tela)', () => {
  let avaliacaoNoBackend: Avaliacao | null;

  beforeEach(() => {
    jest.clearAllMocks();
    avaliacaoNoBackend = null;
    jest.mocked(meService.minhasConversas).mockResolvedValue([]);
    jest.mocked(meService.minhasConsultas).mockResolvedValue([realizada]);
    jest.mocked(meService.minhaConsulta).mockResolvedValue(realizada);
    jest.mocked(meService.minhaAvaliacao).mockImplementation(async () => {
      if (!avaliacaoNoBackend) {
        throw httpError(404);
      }
      return avaliacaoNoBackend;
    });
    jest.mocked(meService.avaliar).mockImplementation(async (r) => {
      avaliacaoNoBackend = {
        id: 1,
        consultaId: r.consultaId,
        nota: r.nota,
        comentario: r.comentario,
        dataCriacao: '2025-08-16T10:00:00',
      };
    });
  });

  async function abrirAvaliacao() {
    await render(
      <Providers navigation>
        <AuthContext.Provider
          value={authValue({ user: { ...usuarioProfissional, role: 'ROLE_PACIENTE' } })}
        >
          <ConfirmDialogProvider>
            <PacienteNavigator />
          </ConfirmDialogProvider>
        </AuthContext.Provider>
      </Providers>,
    );
    await fireEvent.press(screen.getByTestId('tab-consultas'));
    await fireEvent.press(await screen.findByTestId('minha-consulta-8'));
    await fireEvent.press(await screen.findByTestId('consulta-avaliar'));
    await screen.findByRole('header', { name: 'Avaliar atendimento' });
  }

  it('mostra quem e quando; sem nota, não deixa enviar', async () => {
    await abrirAvaliacao();
    expect(screen.getByText('Ana Souza · 15/08/2025 15:00')).toBeOnTheScreen();
    expect(screen.getByTestId('avaliacao-nota')).toHaveTextContent(
      'Toque nas estrelas para dar sua nota',
    );
    expect(screen.getByTestId('avaliacao-enviar')).toBeDisabled();
  });

  it('escolhe a nota, comenta, envia e volta ao detalhe já com a avaliação', async () => {
    await abrirAvaliacao();
    await fireEvent.press(screen.getByTestId('estrela-4'));
    expect(screen.getByTestId('avaliacao-nota')).toHaveTextContent('4 de 5 · Muito bom');
    expect(screen.getByRole('radio', { name: '4 de 5' })).toBeChecked();
    await fireEvent.changeText(screen.getByTestId('avaliacao-comentario'), 'Muito atenciosa');
    await fireEvent.press(screen.getByTestId('avaliacao-enviar'));

    await waitFor(() =>
      expect(meService.avaliar).toHaveBeenCalledWith({
        consultaId: 8,
        nota: 4,
        comentario: 'Muito atenciosa',
      }),
    );
    const resumo = await screen.findByTestId('consulta-minha-avaliacao');
    expect(within(resumo).getByText('★★★★☆')).toBeOnTheScreen();
    expect(within(resumo).getByText('Muito atenciosa')).toBeOnTheScreen();
    expect(screen.queryByTestId('consulta-convite-avaliar')).not.toBeOnTheScreen();
  });

  it('já avaliada em outro aparelho (409): volta ao detalhe, que mostra a avaliação existente', async () => {
    await abrirAvaliacao();
    jest.mocked(meService.avaliar).mockImplementation(async () => {
      avaliacaoNoBackend = {
        id: 2,
        consultaId: 8,
        nota: 3,
        comentario: 'Avaliada no tablet',
        dataCriacao: '2025-08-16T09:00:00',
      };
      throw httpError(409);
    });
    await fireEvent.press(screen.getByTestId('estrela-5'));
    await fireEvent.press(screen.getByTestId('avaliacao-enviar'));

    const resumo = await screen.findByTestId('consulta-minha-avaliacao');
    expect(within(resumo).getByText('Avaliada no tablet')).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Avaliar atendimento' })).not.toBeOnTheScreen();
  });

  it('consulta deixou de estar realizada (400): mostra o erro e troca o formulário pelo aviso', async () => {
    await abrirAvaliacao();
    jest.mocked(meService.avaliar).mockRejectedValue(httpError(400));
    jest.mocked(meService.minhaConsulta).mockResolvedValue({ ...realizada, status: 'CONFIRMADA' });
    await fireEvent.press(screen.getByTestId('estrela-5'));
    await fireEvent.press(screen.getByTestId('avaliacao-enviar'));

    expect(await screen.findByTestId('avaliacao-indisponivel')).toHaveTextContent(
      /Só é possível avaliar consultas já realizadas\./,
    );
    expect(screen.queryByTestId('avaliacao-enviar')).not.toBeOnTheScreen();
  });

  it('"‹ Consulta" volta sem enviar', async () => {
    await abrirAvaliacao();
    await fireEvent.press(screen.getByTestId('voltar'));
    expect(await screen.findByTestId('consulta-convite-avaliar')).toBeOnTheScreen();
    expect(meService.avaliar).not.toHaveBeenCalled();
  });
});

describe('Avaliar Atendimento aberto direto (sem passar pelo convite)', () => {
  const Stack = createNativeStackNavigator<PacienteStackParamList>();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(meService.minhaConsulta).mockResolvedValue(realizada);
    jest.mocked(meService.minhaAvaliacao).mockRejectedValue(httpError(404));
  });

  async function abrirDireto() {
    await render(
      <Providers navigation>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="AvaliarConsulta"
            component={AvaliarAtendimentoScreen}
            initialParams={{ consultaId: 8 }}
          />
        </Stack.Navigator>
      </Providers>,
    );
    await screen.findByRole('header', { name: 'Avaliar atendimento' });
  }

  it('consulta não realizada: aviso no lugar do formulário, sem buscar avaliação', async () => {
    jest.mocked(meService.minhaConsulta).mockResolvedValue({ ...realizada, status: 'AGENDADA' });
    await abrirDireto();

    expect(await screen.findByTestId('avaliacao-indisponivel')).toHaveTextContent(
      /Só é possível avaliar consultas já realizadas\./,
    );
    expect(screen.queryByTestId('estrela-1')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('avaliacao-enviar')).not.toBeOnTheScreen();
    expect(meService.minhaAvaliacao).not.toHaveBeenCalled();
  });

  it('consulta já avaliada: avisa e não deixa avaliar de novo', async () => {
    jest.mocked(meService.minhaAvaliacao).mockResolvedValue({
      id: 1,
      consultaId: 8,
      nota: 4,
      comentario: null,
      dataCriacao: '2025-08-16T10:00:00',
    });
    await abrirDireto();

    expect(await screen.findByTestId('avaliacao-indisponivel')).toHaveTextContent(
      /Você já avaliou esta consulta\./,
    );
    expect(screen.queryByTestId('avaliacao-enviar')).not.toBeOnTheScreen();
  });

  it('erro ao carregar a consulta: "Tentar novamente" recarrega e libera o formulário', async () => {
    jest.mocked(meService.minhaConsulta).mockRejectedValue(httpError(500));
    await abrirDireto();

    expect(await screen.findByText('Não foi possível carregar a consulta.')).toBeOnTheScreen();
    expect(screen.queryByTestId('avaliacao-enviar')).not.toBeOnTheScreen();

    jest.mocked(meService.minhaConsulta).mockResolvedValue(realizada);
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByTestId('estrela-1')).toBeOnTheScreen();
    expect(screen.getByTestId('avaliacao-enviar')).toBeDisabled();
  });
});
