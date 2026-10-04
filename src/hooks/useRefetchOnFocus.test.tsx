import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { useRefetchOnFocus } from './useRefetchOnFocus';

const Stack = createNativeStackNavigator();

function montar(refetch: jest.Mock) {
  function Lista() {
    const [renders, setRenders] = useState(0);
    const navigation = useNavigation<{ navigate: (tela: string) => void }>();
    // Uma função nova a cada render, como `() => { query.refetch() }` numa tela real.
    useRefetchOnFocus(() => refetch());
    return (
      <>
        <Pressable onPress={() => setRenders((n) => n + 1)}>
          <Text>rerender {renders}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Detalhe')}>
          <Text>abrir detalhe</Text>
        </Pressable>
      </>
    );
  }
  function Detalhe() {
    const navigation = useNavigation();
    return (
      <Pressable onPress={() => navigation.goBack()}>
        <Text>voltar</Text>
      </Pressable>
    );
  }
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Lista" component={Lista} />
        <Stack.Screen name="Detalhe" component={Detalhe} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

describe('useRefetchOnFocus', () => {
  it('não recarrega ao montar nem a cada novo render (regressão do loop de refetch)', async () => {
    const refetch = jest.fn();
    await montar(refetch);

    await fireEvent.press(screen.getByText('rerender 0'));
    await fireEvent.press(screen.getByText('rerender 1'));

    expect(screen.getByText('rerender 2')).toBeOnTheScreen();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('recarrega uma vez quando a tela volta a ficar em foco', async () => {
    const refetch = jest.fn();
    await montar(refetch);

    await fireEvent.press(screen.getByText('abrir detalhe'));
    await fireEvent.press(await screen.findByText('voltar'));
    await screen.findByText('abrir detalhe');

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
