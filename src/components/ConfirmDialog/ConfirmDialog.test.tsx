import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { OptionChips } from '../OptionChips/OptionChips';
import { ConfirmDialogProvider, useConfirm, type ConfirmOptions } from './ConfirmDialog';

let resultado: boolean | undefined;

function Botao({ options }: { options: ConfirmOptions }) {
  const confirmar = useConfirm();
  return (
    <Pressable
      onPress={() => {
        // Sem `await`: o handler termina já; a resposta chega quando o diálogo é respondido.
        void confirmar(options).then((r) => {
          resultado = r;
        });
      }}
    >
      <Text>abrir</Text>
    </Pressable>
  );
}

async function abrir(options: ConfirmOptions) {
  resultado = undefined;
  await render(
    <ConfirmDialogProvider>
      <Botao options={options} />
    </ConfirmDialogProvider>,
  );
  await fireEvent.press(screen.getByText('abrir'));
}

describe('ConfirmDialog (origem: core/ui/confirm-dialog)', () => {
  it('mostra título, mensagem e rótulos padrão', async () => {
    await abrir({ titulo: 'Excluir paciente', mensagem: 'Tem certeza?' });

    expect(screen.getByText('Excluir paciente')).toBeOnTheScreen();
    expect(screen.getByText('Tem certeza?')).toBeOnTheScreen();
    expect(screen.getByText('Cancelar')).toBeOnTheScreen();
    expect(screen.getByText('Confirmar')).toBeOnTheScreen();
  });

  it('confirmar resolve true e fecha', async () => {
    await abrir({ titulo: 'T', mensagem: 'M', confirmarLabel: 'Excluir' });

    await fireEvent.press(screen.getByText('Excluir'));

    expect(resultado).toBe(true);
    expect(screen.queryByText('M')).not.toBeOnTheScreen();
  });

  it('cancelar e tocar fora resolvem false', async () => {
    await abrir({ titulo: 'T', mensagem: 'M', cancelarLabel: 'Voltar' });
    await fireEvent.press(screen.getByText('Voltar'));
    expect(resultado).toBe(false);

    await fireEvent.press(screen.getByText('abrir'));
    await fireEvent.press(screen.getByTestId('confirm-overlay'));
    expect(resultado).toBe(false);
  });

  it('botão de confirmar é vermelho por padrão e primário quando destrutivo = false', async () => {
    await abrir({ titulo: 'T', mensagem: 'M' });
    expect(screen.getByTestId('confirm-confirmar')).toHaveStyle({ backgroundColor: '#e15c5c' });
    await fireEvent.press(screen.getByTestId('confirm-cancelar'));

    await abrir({ titulo: 'T', mensagem: 'M', destrutivo: false });
    expect(screen.getByTestId('confirm-confirmar')).toHaveStyle({ backgroundColor: '#0f9aa3' });
  });

  it('exige o provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(renderHook(() => useConfirm())).rejects.toThrow(/ConfirmDialogProvider/);
  });
});

describe('OptionChips', () => {
  it('marca a opção atual e avisa a escolhida', async () => {
    const onChange = jest.fn();
    await render(
      <OptionChips
        label="Sexo"
        valor="Feminino"
        onChange={onChange}
        opcoes={[
          { valor: '', label: 'Não informado' },
          { valor: 'Feminino', label: 'Feminino' },
        ]}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Feminino' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Não informado' })).not.toBeChecked();
    await act(async () => {
      await fireEvent.press(screen.getByRole('radio', { name: 'Não informado' }));
    });
    expect(onChange).toHaveBeenCalledWith('');
  });
});
