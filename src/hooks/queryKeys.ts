/**
 * Chaves do cache do TanStack Query, organizadas por recurso. A primeira posição agrupa o
 * recurso, então invalidar `['consultas']` também invalida listas filtradas e detalhes.
 */
export const queryKeys = {
  consultas: {
    todas: ['consultas'] as const,
    lista: (pacienteId?: number) =>
      pacienteId != null
        ? (['consultas', 'lista', { pacienteId }] as const)
        : (['consultas', 'lista'] as const),
    detalhe: (id: number) => ['consultas', 'detalhe', id] as const,
  },
  pacientes: {
    todos: ['pacientes'] as const,
    lista: () => ['pacientes', 'lista'] as const,
    detalhe: (id: number) => ['pacientes', 'detalhe', id] as const,
  },
  profissionais: {
    todos: ['profissionais'] as const,
    lista: () => ['profissionais', 'lista'] as const,
    detalhe: (id: number) => ['profissionais', 'detalhe', id] as const,
  },
  adminPacientes: {
    todos: ['admin-pacientes'] as const,
    lista: () => ['admin-pacientes', 'lista'] as const,
    detalhe: (id: number) => ['admin-pacientes', 'detalhe', id] as const,
  },
  mensagens: {
    todas: ['mensagens'] as const,
    caixaEntrada: () => ['mensagens', 'caixa-entrada'] as const,
    conversa: (pacienteId: number) => ['mensagens', 'conversa', pacienteId] as const,
  },
  avaliacoes: {
    todas: ['avaliacoes'] as const,
    daConsulta: (consultaId: number) => ['avaliacoes', 'consulta', consultaId] as const,
  },
  /** Autoatendimento do paciente (`/me/**`). */
  me: {
    todos: ['me'] as const,
    perfil: () => ['me', 'perfil'] as const,
    consultas: () => ['me', 'consultas'] as const,
    consulta: (id: number) => ['me', 'consultas', id] as const,
    conversas: () => ['me', 'conversas'] as const,
    conversa: (profissionalId: number) => ['me', 'conversas', profissionalId] as const,
    avaliacao: (consultaId: number) => ['me', 'avaliacoes', consultaId] as const,
    profissionais: (nome?: string, especialidade?: string) =>
      ['me', 'profissionais', { nome: nome ?? '', especialidade: especialidade ?? '' }] as const,
    profissional: (id: number) => ['me', 'profissional', id] as const,
    disponibilidade: (profissionalId: number, data: string) =>
      ['me', 'disponibilidade', profissionalId, data] as const,
  },
};
