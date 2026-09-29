// Origem: core/consultas/consulta-booking.model.ts (Angular). `ProfissionalBusca` = `ProfissionalPublicoResponse` do backend.

import type { TipoConsulta } from './consulta';

export interface ProfissionalBusca {
  id: number;
  nome: string;
  especialidade: string;
  valorConsultaParticular: number | null;
  conveniosAceitos: string[];
}

export interface SlotDisponibilidade {
  horario: string;
  disponivel: boolean;
}

export interface DisponibilidadeResponse {
  data: string;
  horarios: SlotDisponibilidade[];
}

export interface ConsultaBookingRequest {
  profissionalId: number;
  dataHora: string;
  tipo: TipoConsulta;
  convenio: string | null;
}
