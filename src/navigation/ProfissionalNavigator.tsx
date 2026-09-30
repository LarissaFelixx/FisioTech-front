import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Icon, type IconName } from '../components/Icon/Icon';
import { PacienteFormScreen } from '../screens/Pacientes/PacienteFormScreen';
import { PacienteListScreen } from '../screens/Pacientes/PacienteListScreen';
import { PlaceholderScreen } from '../screens/Placeholder/PlaceholderScreen';
import { ProfissionalHomeScreen } from '../screens/ProfissionalHome/ProfissionalHomeScreen';
import { colors, fonts } from '../theme';
import type { ProfissionalStackParamList, ProfissionalTabsParamList } from './types';

const Tabs = createBottomTabNavigator<ProfissionalTabsParamList>();
const Stack = createNativeStackNavigator<ProfissionalStackParamList>();

const TAB_ICONS: Record<keyof ProfissionalTabsParamList, IconName> = {
  Home: 'home',
  Pacientes: 'users',
  Consultas: 'calendar',
  Mensagens: 'chat',
};

// Telas que ainda não foram migradas (batches 4 a 7).
const ConsultasPlaceholder = () => (
  <PlaceholderScreen title="Consultas" message="A lista de consultas chega no Batch 5." />
);
const MensagensPlaceholder = () => (
  <PlaceholderScreen title="Mensagens" message="As mensagens chegam no Batch 7." />
);
const ConsultaNovaPlaceholder = () => (
  <PlaceholderScreen title="Nova consulta" message="O agendamento de consulta chega no Batch 5." />
);
const MensagemThreadPlaceholder = () => (
  <PlaceholderScreen title="Mensagens" message="A conversa com o paciente chega no Batch 7." />
);
const ConsultaDetalhePlaceholder = () => (
  <PlaceholderScreen title="Prontuário" message="O detalhe da consulta chega no Batch 5." />
);
const ConsultaWizardPlaceholder = () => (
  <PlaceholderScreen title="Registro clínico" message="O registro clínico chega no Batch 6." />
);
const AlterarSenhaPlaceholder = () => (
  <PlaceholderScreen title="Alterar senha" message="A troca de senha chega no Batch 7." />
);

function ProfissionalTabs() {
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
      <Tabs.Screen name="Home" component={ProfissionalHomeScreen} />
      <Tabs.Screen name="Pacientes" component={PacienteListScreen} />
      <Tabs.Screen name="Consultas" component={ConsultasPlaceholder} />
      <Tabs.Screen name="Mensagens" component={MensagensPlaceholder} />
    </Tabs.Navigator>
  );
}

/** Área do profissional: abas + telas empilhadas por cima delas. */
export function ProfissionalNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="Tabs" component={ProfissionalTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="PacienteForm"
        component={PacienteFormScreen}
        options={{ title: 'Paciente' }}
      />
      <Stack.Screen
        name="ConsultaNova"
        component={ConsultaNovaPlaceholder}
        options={{ title: 'Nova Consulta' }}
      />
      <Stack.Screen
        name="MensagemThread"
        component={MensagemThreadPlaceholder}
        options={{ title: 'Mensagens' }}
      />
      <Stack.Screen
        name="ConsultaDetalhe"
        component={ConsultaDetalhePlaceholder}
        options={{ title: 'Consulta' }}
      />
      <Stack.Screen
        name="ConsultaWizard"
        component={ConsultaWizardPlaceholder}
        options={{ title: 'Registro Clínico' }}
      />
      <Stack.Screen
        name="AlterarSenha"
        component={AlterarSenhaPlaceholder}
        options={{ title: 'Alterar Senha' }}
      />
    </Stack.Navigator>
  );
}
