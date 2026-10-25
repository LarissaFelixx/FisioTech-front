import type { NavigatorScreenParams } from '@react-navigation/native';

/** Rotas do fluxo não autenticado. */
export type AuthStackParamList = {
  Login: undefined;
  RecuperacaoSenha: undefined;
  /** Segunda etapa da recuperação: `email` que recebeu o código. */
  RedefinirSenha: { email: string };
  /** Terceira etapa da recuperação: confirmação de senha redefinida. */
  SenhaRedefinida: undefined;
};

/** Abas do administrador (barra inferior do Figma "12 Admin · Profissionais"). */
export type AdminTabsParamList = {
  Profissionais: undefined;
  Pacientes: undefined;
};

/** Telas do administrador abertas por cima das abas. */
export type AdminStackParamList = {
  Tabs: NavigatorScreenParams<AdminTabsParamList>;
  AlterarSenha: undefined;
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
  /** Sem `id`: cadastro; com `id`: edição. */
  PacienteForm: { id?: number };
  ConsultaNova: { pacienteId?: number };
  MensagemThread: { pacienteId: number; nome?: string };
  ConsultaDetalhe: { id: number };
  ConsultaWizard: { id: number };
  AlterarSenha: undefined;
};

/** Abas do paciente (barra inferior do Figma: Home, Consultas, Mensagens e Perfil). */
export type PacienteTabsParamList = {
  Home: undefined;
  Consultas: undefined;
  Mensagens: undefined;
  Perfil: undefined;
};

/** Telas do paciente abertas por cima das abas. */
export type PacienteStackParamList = {
  Tabs: NavigatorScreenParams<PacienteTabsParamList>;
  MensagemThread: { profissionalId: number; nome?: string };
  ConsultaDetalhe: { id: number };
  MeuTratamento: undefined;
};
