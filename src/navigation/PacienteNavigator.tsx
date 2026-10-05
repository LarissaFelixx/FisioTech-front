import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { PacienteChatScreen } from '../screens/Chat/PacienteChatScreen';
import { PacienteInboxScreen } from '../screens/Chat/PacienteInboxScreen';
import { colors, fonts, spacing } from '../theme';
import type { PacienteStackParamList } from './types';

const Stack = createNativeStackNavigator<PacienteStackParamList>();

/** Primeira área do paciente: caixa de entrada e conversas HTTP. */
export function PacienteNavigator() {
  const { logout } = useAuth();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerStyle: { backgroundColor: colors.surface },
      }}
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
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  logout: { padding: spacing.sm },
  label: { color: colors.primaryDark, fontFamily: fonts.semibold },
});
