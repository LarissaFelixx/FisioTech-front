import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import { DURACAO_TOAST_MS, Toast, useToast } from './Toast';

async function avancar(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('mostra a mensagem e avisa que fechou depois da duração', async () => {
    const onFechar = jest.fn();
    await render(<Toast mensagem="Salvo." onFechar={onFechar} />);

    expect(screen.getByTestId('toast')).toHaveTextContent('Salvo.');
    await avancar(DURACAO_TOAST_MS);
    expect(onFechar).not.toHaveBeenCalled();
    // Depois da animação de saída.
    await avancar(300);
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('não chama onFechar depois de desmontado', async () => {
    const onFechar = jest.fn();
    const { unmount } = await render(<Toast mensagem="Salvo." onFechar={onFechar} />);
    await act(async () => unmount());
    await avancar(DURACAO_TOAST_MS * 2);
    expect(onFechar).not.toHaveBeenCalled();
  });
});

describe('useToast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function Tela() {
    const { toast, mostrarToast } = useToast();
    return (
      <View>
        <Pressable onPress={() => mostrarToast('Perfil salvo.')}>
          <Text>Salvar</Text>
        </Pressable>
        {toast}
      </View>
    );
  }

  it('some sozinho, sem nenhuma outra ação na tela', async () => {
    await render(<Tela />);
    expect(screen.queryByTestId('toast')).toBeNull();

    await fireEvent.press(screen.getByText('Salvar'));
    expect(screen.getByTestId('toast')).toHaveTextContent('Perfil salvo.');

    await avancar(DURACAO_TOAST_MS + 300);
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('mostrar de novo com o toast na tela reinicia o tempo', async () => {
    await render(<Tela />);
    await fireEvent.press(screen.getByText('Salvar'));
    await avancar(DURACAO_TOAST_MS - 500);

    await fireEvent.press(screen.getByText('Salvar'));
    await avancar(DURACAO_TOAST_MS - 500);
    expect(screen.getByTestId('toast')).toBeOnTheScreen();

    await avancar(800);
    expect(screen.queryByTestId('toast')).toBeNull();
  });
});
