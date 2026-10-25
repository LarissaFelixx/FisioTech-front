import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Icon, type IconName } from '../components/Icon/Icon';
import { PacienteChatScreen } from '../screens/Chat/PacienteChatScreen';
import { PacienteInboxScreen } from '../screens/Chat/PacienteInboxScreen';
import { MarcarConsultaScreen } from '../screens/Paciente/Consulta/MarcarConsultaScreen';
import { MinhasConsultasScreen } from '../screens/Paciente/Consulta/MinhasConsultasScreen';
import { HomePacienteScreen } from '../screens/Paciente/Home/HomePacienteScreen';
import {
  ConsultaDetalheProvisoriaScreen,
  MeuTratamentoProvisoriaScreen,
  PerfilProvisoriaScreen,
} from '../screens/Paciente/PacienteProvisoriaScreens';
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
      <Tabs.Screen name="Home" component={HomePacienteScreen} />
      <Tabs.Screen name="Consultas" component={MinhasConsultasScreen} />
      <Tabs.Screen name="Mensagens" component={PacienteInboxScreen} />
      <Tabs.Screen name="Perfil" component={PerfilProvisoriaScreen} />
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
        name="ConsultaDetalhe"
        component={ConsultaDetalheProvisoriaScreen}
        options={{ title: 'Consulta' }}
      />
      <Stack.Screen
        name="MeuTratamento"
        component={MeuTratamentoProvisoriaScreen}
        options={{ title: 'Meu Tratamento' }}
      />
      <Stack.Screen
        name="MarcarConsulta"
        component={MarcarConsultaScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
