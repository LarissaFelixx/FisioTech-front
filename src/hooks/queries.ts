import { useQuery } from '@tanstack/react-query';

import { consultaService } from '../services/consultaService';
import { pacienteService } from '../services/pacienteService';

export const queryKeys = {
  consultas: (pacienteId?: number) =>
    pacienteId != null ? (['consultas', { pacienteId }] as const) : (['consultas'] as const),
  pacientes: () => ['pacientes'] as const,
};

/** Consultas do profissional logado (`GET /consultas`). */
export function useConsultas() {
  return useQuery({
    queryKey: queryKeys.consultas(),
    queryFn: () => consultaService.listarTodos(),
  });
}

/** Pacientes do profissional logado (`GET /pacientes`). */
export function usePacientes() {
  return useQuery({
    queryKey: queryKeys.pacientes(),
    queryFn: () => pacienteService.listarTodos(),
  });
}
