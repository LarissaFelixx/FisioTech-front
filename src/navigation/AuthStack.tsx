import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PlaceholderScreen } from '../screens/Placeholder/PlaceholderScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

function LoginPlaceholder() {
  return <PlaceholderScreen title="Entrar" message="A tela de login chega no Batch 2." />;
}

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginPlaceholder} />
    </Stack.Navigator>
  );
}
