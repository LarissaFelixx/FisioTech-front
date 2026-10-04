import { fireEvent, render, screen } from '@testing-library/react-native';

import { Avatar } from './Avatar/Avatar';
import { Button } from './Button/Button';
import { ErrorState } from './ErrorState/ErrorState';
import { ICON_NAMES, Icon } from './Icon/Icon';
import { Skeleton } from './Skeleton/Skeleton';
import { TextField } from './TextField/TextField';

describe('Skeleton (mesmas variantes do Angular)', () => {
  it('tem papel de progresso para leitores de tela', async () => {
    await render(<Skeleton />);
    expect(screen.getByRole('progressbar', { name: 'Carregando' })).toBeOnTheScreen();
  });

  it.each(['lines', 'list', 'form', 'thread'] as const)(
    'variante "%s" renderiza "count" itens',
    async (variant) => {
      await render(<Skeleton variant={variant} count={4} />);
      expect(screen.getByTestId(`skeleton-${variant}`)).toBeOnTheScreen();
      expect(screen.getAllByTestId('skeleton-item')).toHaveLength(4);
    },
  );
});

describe('Avatar', () => {
  it('mostra as iniciais do nome (decorativo: oculto para leitores de tela)', async () => {
    await render(<Avatar nome="maria da silva" />);
    expect(screen.queryByText('MD')).not.toBeOnTheScreen();
    expect(screen.getByText('MD', { includeHiddenElements: true })).toBeOnTheScreen();
  });
});

describe('Icon', () => {
  it('tem os 21 ícones do Angular e renderiza todos', async () => {
    expect(ICON_NAMES).toHaveLength(21);
    await render(
      <>
        {ICON_NAMES.map((name) => (
          <Icon key={name} name={name} color="#000" testID={`icon-${name}`} />
        ))}
      </>,
    );
    for (const name of ICON_NAMES) {
      expect(screen.getByTestId(`icon-${name}`)).toBeOnTheScreen();
    }
  });
});

describe('Button', () => {
  it('chama onPress e fica desabilitado enquanto carrega', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(<Button label="Salvar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(<Button label="Salvar" onPress={onPress} loading />);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });
});

describe('ErrorState', () => {
  it('mostra a mensagem e o "Tentar novamente"', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState message="Falhou." onRetry={onRetry} />);

    expect(screen.getByText('Falhou.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('TextField', () => {
  it('usa o rótulo como nome acessível e mostra o erro', async () => {
    await render(<TextField label="Email" value="" error="Email inválido." />);
    expect(screen.getByLabelText('Email')).toBeOnTheScreen();
    expect(screen.getByText('Email inválido.')).toBeOnTheScreen();
  });
});
