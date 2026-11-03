import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AdminOnly } from '../components/AdminOnly/AdminOnly';
import { ProfileMenu } from '../components/ProfileMenu/ProfileMenu';
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

type DestinoMenuAdmin = 'Profissionais' | 'Pacientes' | 'CriacaoSenha';

function MenuAdmin({ abrir }: { abrir: (destino: DestinoMenuAdmin) => void }) {
  const { user, logout } = useAuth();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir menu do administrador"
        accessibilityState={{ expanded: aberto }}
        testID="admin-menu"
        onPress={() => setAberto(true)}
        style={styles.trigger}
      >
        <Text style={styles.label}>Menu</Text>
      </Pressable>
      <ProfileMenu
        visible={aberto}
        nome={user?.nome ?? ''}
        items={[
          { label: 'Gerenciar profissionais', icon: 'user', onPress: () => abrir('Profissionais') },
          { label: 'Gerenciar pacientes', icon: 'users', onPress: () => abrir('Pacientes') },
          {
            label: 'Definir senha de outra conta',
            icon: 'lock',
            onPress: () => abrir('CriacaoSenha'),
          },
        ]}
        onClose={() => setAberto(false)}
        onLogout={() => void logout()}
      />
    </>
  );
}

export function AdminNavigator() {
  return (
    <AdminOnly>
      <Stack.Navigator
        screenOptions={({ route, navigation }) => ({
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.bold },
          headerStyle: { backgroundColor: colors.surface },
          ...((route.name === 'Profissionais' || route.name === 'Pacientes') && {
            headerRight: () => (
              <MenuAdmin
                abrir={(destino) => {
                  if (destino === route.name) {
                    return;
                  }
                  if (destino === 'Profissionais') {
                    navigation.popTo('Profissionais');
                    return;
                  }
                  navigation.navigate(destino);
                }}
              />
            ),
          }),
        })}
      >
        <Stack.Screen
          name="Profissionais"
          component={ProfissionalListScreen}
          options={{ title: 'Administração' }}
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
  trigger: { padding: spacing.sm },
  label: { color: colors.primaryDark, fontFamily: fonts.semibold },
});
