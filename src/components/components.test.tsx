import { fireEvent, render, screen } from '@testing-library/react-native';

import { Avatar } from './Avatar/Avatar';
import { Button } from './Button/Button';
import { ErrorState } from './ErrorState/ErrorState';
import { ICON_NAMES, Icon } from './Icon/Icon';
import { Skeleton } from './Skeleton/Skeleton';
import { OptionChips } from './OptionChips/OptionChips';
import { TextField } from './TextField/TextField';
import { ToggleChips } from './ToggleChips/ToggleChips';

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

  it('multilinha: altura mínima pelo número de linhas e texto a partir do topo', async () => {
    await render(<TextField label="Queixa" value="" multiline numberOfLines={3} testID="campo" />);
    expect(screen.getByTestId('campo')).toHaveStyle({ minHeight: 90, textAlignVertical: 'top' });
  });

  it('linha única não ganha altura mínima', async () => {
    await render(<TextField label="Nome" value="" testID="campo" />);
    expect(screen.getByTestId('campo')).not.toHaveStyle({ textAlignVertical: 'top' });
  });
});

describe('OptionChips', () => {
  it('cada opção ganha um testID "<grupo>-<valor>" (usado no e2e)', async () => {
    const onChange = jest.fn();
    await render(
      <OptionChips
        label="Tabagismo"
        opcoes={[
          { valor: 'sim', label: 'Sim' },
          { valor: 'nao', label: 'Não' },
        ]}
        valor="nao"
        onChange={onChange}
        testID="tabagismo"
      />,
    );
    expect(screen.getByTestId('tabagismo-nao')).toBeChecked();
    await fireEvent.press(screen.getByTestId('tabagismo-sim'));
    expect(onChange).toHaveBeenCalledWith('sim');
  });
});

describe('ToggleChips', () => {
  const opcoes = ['Asma', 'Diabetes'].map((o) => ({ valor: o, label: o }));

  it('cada chip é uma caixa de seleção com o estado marcado', async () => {
    const onToggle = jest.fn();
    await render(
      <ToggleChips label="Histórico" opcoes={opcoes} selecionados={['Asma']} onToggle={onToggle} />,
    );
    expect(screen.getByText('Histórico')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Asma' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Diabetes' })).not.toBeChecked();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Diabetes' }));
    expect(onToggle).toHaveBeenCalledWith('Diabetes');
  });
});
