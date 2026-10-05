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
  /** Sem `id`: cadastro; com `id`: edição. */
  PacienteForm: { id?: number };
  ConsultaNova: { pacienteId?: number };
  MensagemThread: { pacienteId: number; nome?: string };
  ConsultaDetalhe: { id: number };
  ConsultaWizard: { id: number };
  AlterarSenha: undefined;
};

/** Área do paciente disponível nesta entrega. */
export type PacienteStackParamList = {
  Mensagens: undefined;
  MensagemThread: { profissionalId: number; nome?: string };
};
