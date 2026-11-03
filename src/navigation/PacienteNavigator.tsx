import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { PacienteChatScreen } from '../screens/Chat/PacienteChatScreen';
import { PacienteInboxScreen } from '../screens/Chat/PacienteInboxScreen';
import { AlterarSenhaPacienteScreen } from '../screens/Paciente/Senha/AlterarSenhaPacienteScreen';
import { colors, fonts, spacing } from '../theme';
import type { PacienteStackParamList } from './types';

const Stack = createNativeStackNavigator<PacienteStackParamList>();

/** Primeira área do paciente: caixa de entrada e conversas HTTP. */
export function PacienteNavigator() {
  const { logout } = useAuth();
  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerStyle: { backgroundColor: colors.surface },
        ...(route.name === 'Mensagens' && {
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Alterar minha senha"
              testID="paciente-abrir-senha"
              onPress={() => navigation.navigate('AlterarSenha')}
              style={styles.senha}
            >
              <Text style={styles.label}>Senha</Text>
            </Pressable>
          ),
        }),
      })}
    >
      <Stack.Screen
        name="Mensagens"
        component={PacienteInboxScreen}
        options={{
          title: 'Mensagens',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sair"
              testID="paciente-sair"
              onPress={() => void logout()}
              style={styles.logout}
            >
              <Text style={styles.label}>Sair</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="MensagemThread"
        component={PacienteChatScreen}
        options={{ title: 'Conversa' }}
      />
      <Stack.Screen
        name="AlterarSenha"
        component={AlterarSenhaPacienteScreen}
        options={{ title: 'Alterar Senha' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  senha: { padding: spacing.sm, marginRight: spacing.sm },
  logout: { padding: spacing.sm },
  label: { color: colors.primaryDark, fontFamily: fonts.semibold },
});
