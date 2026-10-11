import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/Login/LoginScreen';
import { RecuperacaoSenhaScreen } from '../screens/RecuperacaoSenha/RecuperacaoSenhaScreen';
import { RedefinirSenhaScreen } from '../screens/RecuperacaoSenha/RedefinirSenhaScreen';
import { SenhaRedefinidaScreen } from '../screens/RecuperacaoSenha/SenhaRedefinidaScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RecuperacaoSenha" component={RecuperacaoSenhaScreen} />
      <Stack.Screen name="RedefinirSenha" component={RedefinirSenhaScreen} />
      <Stack.Screen name="SenhaRedefinida" component={SenhaRedefinidaScreen} />
    </Stack.Navigator>
  );
}
