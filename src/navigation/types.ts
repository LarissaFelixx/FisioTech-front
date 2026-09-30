import type { NavigatorScreenParams } from '@react-navigation/native';

/** Rotas do fluxo não autenticado. */
export type AuthStackParamList = {
  Login: undefined;
};

/** Abas do profissional (bottom nav do Shell do Angular). */
export type ProfissionalTabsParamList = {
  Home: undefined;
  Pacientes: undefined;
  Consultas: undefined;
  Mensagens: undefined;
};

/** Telas do profissional abertas por cima das abas (`hideNav` no Angular). */
export type ProfissionalStackParamList = {
  Tabs: NavigatorScreenParams<ProfissionalTabsParamList>;
  ConsultaDetalhe: { id: number };
  ConsultaWizard: { id: number };
  AlterarSenha: undefined;
};
