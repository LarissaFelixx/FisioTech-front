import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminOnly } from '../components/AdminOnly/AdminOnly';
import { Icon, type IconName } from '../components/Icon/Icon';
import { AdminCabecalho } from '../screens/Admin/AdminCabecalho';
import { PacientesProvisoriaScreen } from '../screens/Admin/AdminProvisoriaScreens';
import { EditarProfissionalScreen } from '../screens/Admin/Profissionais/EditarProfissionalScreen';
import { NovoProfissionalScreen } from '../screens/Admin/Profissionais/NovoProfissionalScreen';
import { ProfissionalListScreen } from '../screens/Admin/Profissionais/ProfissionalListScreen';
import { AlterarSenhaAdminScreen } from '../screens/Admin/Senha/AlterarSenhaAdminScreen';
import { useMenuAdmin } from '../screens/Admin/useMenuAdmin';
import { colors, fonts, spacing } from '../theme';
import type { AdminStackParamList, AdminTabsParamList } from './types';

const Tabs = createBottomTabNavigator<AdminTabsParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

const TAB_ICONS: Record<keyof AdminTabsParamList, IconName> = {
  Profissionais: 'briefcase',
  Pacientes: 'users',
};

function ProfissionaisTab() {
  const { menu, abrirMenu } = useMenuAdmin();

  return (
    <SafeAreaView style={styles.tab} edges={['top']}>
      <View style={styles.cabecalho}>
        <AdminCabecalho titulo="Administração" onAbrirMenu={abrirMenu} />
      </View>
      <ProfissionalListScreen />
      {menu}
    </SafeAreaView>
  );
}

function AdminTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.navInactive,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => (
          <Icon name={TAB_ICONS[route.name]} color={color} size={size} />
        ),
        tabBarButtonTestID: `tab-${route.name.toLowerCase()}`,
      })}
    >
      <Tabs.Screen name="Profissionais" component={ProfissionaisTab} />
      <Tabs.Screen name="Pacientes" component={PacientesProvisoriaScreen} />
    </Tabs.Navigator>
  );
}

const styles = StyleSheet.create({
  tab: { flex: 1, backgroundColor: colors.bg },
  cabecalho: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
});

/** Área do administrador: abas (Figma) + telas empilhadas por cima delas. */
export function AdminNavigator() {
  return (
    <AdminOnly>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.bold },
          headerStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="Tabs" component={AdminTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="AlterarSenha"
          component={AlterarSenhaAdminScreen}
          // O "‹ Profissionais" no topo da tela substitui o header nativo, como no Figma.
          options={{ headerShown: false }}
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
