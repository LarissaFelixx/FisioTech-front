import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ProfileMenu } from '../components/ProfileMenu/ProfileMenu';
import { useAuth } from '../hooks/useAuth';
import { PacienteChatScreen } from '../screens/Chat/PacienteChatScreen';
import { PacienteInboxScreen } from '../screens/Chat/PacienteInboxScreen';
import { colors, fonts, spacing } from '../theme';
import { ROLES } from '../types/auth';
import type { PacienteStackParamList } from './types';

const Stack = createNativeStackNavigator<PacienteStackParamList>();

function MenuPaciente() {
  const { status, user, logout } = useAuth();
  const [aberto, setAberto] = useState(false);

  if (status !== 'signedIn' || user?.role !== ROLES.paciente) {
    return null;
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir menu do paciente"
        accessibilityState={{ expanded: aberto }}
        testID="paciente-menu"
        onPress={() => setAberto(true)}
        style={styles.trigger}
      >
        <Text style={styles.label}>Menu</Text>
      </Pressable>
      <ProfileMenu
        visible={aberto}
        nome={user.nome}
        items={[]}
        onClose={() => setAberto(false)}
        onLogout={() => void logout()}
      />
    </>
  );
}

/** Área do paciente: caixa de entrada e conversas HTTP. */
export function PacienteNavigator() {
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
          headerRight: () => <MenuPaciente />,
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
  trigger: { padding: spacing.sm },
  label: { color: colors.primaryDark, fontFamily: fonts.semibold },
});
