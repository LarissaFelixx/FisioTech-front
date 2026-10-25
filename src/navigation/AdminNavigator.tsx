import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Icon, type IconName } from '../components/Icon/Icon';
import {
  AlterarSenhaAdminProvisoriaScreen,
  PacientesProvisoriaScreen,
  ProfissionaisProvisoriaScreen,
} from '../screens/Admin/AdminProvisoriaScreens';
import { colors, fonts } from '../theme';
import type { AdminStackParamList, AdminTabsParamList } from './types';

const Tabs = createBottomTabNavigator<AdminTabsParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

const TAB_ICONS: Record<keyof AdminTabsParamList, IconName> = {
  Profissionais: 'briefcase',
  Pacientes: 'users',
};

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
      <Tabs.Screen name="Profissionais" component={ProfissionaisProvisoriaScreen} />
      <Tabs.Screen name="Pacientes" component={PacientesProvisoriaScreen} />
    </Tabs.Navigator>
  );
}

/** Área do administrador: abas (Figma) + telas empilhadas por cima delas. */
export function AdminNavigator() {
  return (
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
        component={AlterarSenhaAdminProvisoriaScreen}
        options={{ title: 'Alterar Senha' }}
      />
    </Stack.Navigator>
  );
}
