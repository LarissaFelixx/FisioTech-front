import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Icon, type IconName } from '../components/Icon/Icon';
import { PacienteChatScreen } from '../screens/Chat/PacienteChatScreen';
import { PacienteInboxScreen } from '../screens/Chat/PacienteInboxScreen';
import { HomeProvisoriaScreen } from '../screens/Paciente/HomeProvisoriaScreen';
import { MeuPerfilScreen } from '../screens/Paciente/Perfil/MeuPerfilScreen';
import { PlaceholderScreen } from '../screens/Placeholder/PlaceholderScreen';
import { colors, fonts } from '../theme';
import type { PacienteStackParamList, PacienteTabsParamList } from './types';

const Tabs = createBottomTabNavigator<PacienteTabsParamList>();
const Stack = createNativeStackNavigator<PacienteStackParamList>();

const TAB_ICONS: Record<keyof PacienteTabsParamList, IconName> = {
  Home: 'home',
  Consultas: 'calendar',
  Mensagens: 'chat',
  Perfil: 'user',
};

// Telas que ainda não existem (Minhas Consultas é a atividade #39).
const ConsultasPlaceholder = () => (
  <PlaceholderScreen
    title="Minhas Consultas"
    message="A lista de consultas chega com a atividade #39."
  />
);
const AlterarSenhaPlaceholder = () => (
  <PlaceholderScreen title="Alterar Senha" message="A troca de senha chega com a atividade #45." />
);

function PacienteTabs() {
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
      <Tabs.Screen name="Home" component={HomeProvisoriaScreen} />
      <Tabs.Screen name="Consultas" component={ConsultasPlaceholder} />
      <Tabs.Screen name="Mensagens" component={PacienteInboxScreen} />
      <Tabs.Screen name="Perfil" component={MeuPerfilScreen} />
    </Tabs.Navigator>
  );
}

/** Área do paciente: abas (Figma) + telas empilhadas por cima delas. */
export function PacienteNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="Tabs" component={PacienteTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="MensagemThread"
        component={PacienteChatScreen}
        options={{ title: 'Conversa' }}
      />
      <Stack.Screen
        name="AlterarSenha"
        component={AlterarSenhaPlaceholder}
        options={{ title: 'Alterar Senha' }}
      />
    </Stack.Navigator>
  );
}
