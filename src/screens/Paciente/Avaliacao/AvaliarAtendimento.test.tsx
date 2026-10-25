import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { ConfirmDialogProvider } from '../../../components/ConfirmDialog/ConfirmDialog';
import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { consulta, httpError, Providers } from '../../../test/helpers';
import type { Avaliacao } from '../../../types/avaliacao';
import {
  mensagemErroAvaliar,
  montarAvaliacao,
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

  it('consulta já avaliada (409) mostra a mensagem e fica na tela', async () => {
    jest.mocked(meService.avaliar).mockRejectedValue(httpError(409));
    await abrirAvaliacao();
    await fireEvent.press(screen.getByTestId('estrela-5'));
    await fireEvent.press(screen.getByTestId('avaliacao-enviar'));
    expect(await screen.findByTestId('avaliacao-erro')).toHaveTextContent(
      'Esta consulta já foi avaliada.',
    );
    expect(screen.getByRole('header', { name: 'Avaliar atendimento' })).toBeOnTheScreen();
  });

  it('"‹ Consulta" volta sem enviar', async () => {
    await abrirAvaliacao();
    await fireEvent.press(screen.getByTestId('voltar'));
    expect(await screen.findByTestId('consulta-convite-avaliar')).toBeOnTheScreen();
    expect(meService.avaliar).not.toHaveBeenCalled();
  });
});
