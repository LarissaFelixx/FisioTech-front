import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AdminOnly } from '../components/AdminOnly/AdminOnly';
import { useAuth } from '../hooks/useAuth';
import { ProfissionalFormScreen } from '../screens/Admin/Profissionais/ProfissionalFormScreen';
import { ProfissionalListScreen } from '../screens/Admin/Profissionais/ProfissionalListScreen';
import { colors, fonts, spacing } from '../theme';
import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  const { logout } = useAuth();

  return (
    <AdminOnly>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.bold },
          headerStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen
          name="Profissionais"
          component={ProfissionalListScreen}
          options={{
            title: 'Administração',
            headerRight: () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sair"
                testID="admin-sair"
                onPress={() => void logout()}
                style={styles.logout}
              >
                <Text style={styles.logoutText}>Sair</Text>
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="ProfissionalForm"
          component={ProfissionalFormScreen}
          options={{ title: 'Profissional' }}
        />
      </Stack.Navigator>
    </AdminOnly>
  );
}

const styles = StyleSheet.create({
  logout: { padding: spacing.sm },
  logoutText: { color: colors.primaryDark, fontFamily: fonts.semibold },
});
