import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminOnly } from '../components/AdminOnly/AdminOnly';
import { useAuth } from '../hooks/useAuth';
import { CriacaoSenhaAdminScreen } from '../screens/Admin/Senhas/CriacaoSenhaAdminScreen';
import { PacienteAdminListScreen } from '../screens/Admin/Pacientes/PacienteAdminListScreen';
import { EditarPacienteAdminScreen } from '../screens/Admin/Pacientes/EditarPacienteAdminScreen';
import { EditarProfissionalScreen } from '../screens/Admin/Profissionais/EditarProfissionalScreen';
import { NovoProfissionalScreen } from '../screens/Admin/Profissionais/NovoProfissionalScreen';
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
          options={({ navigation }) => ({
            title: 'Administração',
            headerRight: () => (
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Administrar pacientes"
                  testID="admin-abrir-pacientes"
                  onPress={() => navigation.navigate('Pacientes')}
                  style={styles.logout}
                >
                  <Text style={styles.logoutText}>Pacientes</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sair"
                  testID="admin-sair"
                  onPress={() => void logout()}
                  style={styles.logout}
                >
                  <Text style={styles.logoutText}>Sair</Text>
                </Pressable>
              </View>
            ),
          })}
        />
        <Stack.Screen
          name="Pacientes"
          component={PacienteAdminListScreen}
          options={{ title: 'Admin - Pacientes' }}
        />
        <Stack.Screen
          name="CriacaoSenha"
          component={CriacaoSenhaAdminScreen}
          options={{ title: 'Admin - Criação de senha' }}
        />
        <Stack.Screen
          name="EditarPaciente"
          component={EditarPacienteAdminScreen}
          options={{ title: 'Admin - Editar Paciente' }}
        />
        <Stack.Screen
          name="NovoProfissional"
          component={NovoProfissionalScreen}
          options={{ title: 'Novo profissional' }}
        />
        <Stack.Screen
          name="EditarProfissional"
          component={EditarProfissionalScreen}
          options={{ title: 'Editar profissional' }}
        />
      </Stack.Navigator>
    </AdminOnly>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logout: { padding: spacing.sm },
  logoutText: { color: colors.primaryDark, fontFamily: fonts.semibold },
});
