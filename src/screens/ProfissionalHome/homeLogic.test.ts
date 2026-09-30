import { consulta } from '../../test/helpers';
import {
  agendaHoje,
  consultasHoje,
  countdown,
  proximaConsulta,
  subtitulo,
  tipoLabel,
} from './homeLogic';

// "Agora" fixo: 29/09/2026 às 10:00, hora local.
const agora = new Date(2026, 8, 29, 10, 0);

describe('proximaConsulta', () => {
  it('escolhe a primeira AGENDADA/CONFIRMADA a partir de agora', () => {
    const passada = consulta({ id: 1, dataHora: '2026-09-29T09:00:00' });
    const cancelada = consulta({ id: 2, dataHora: '2026-09-29T10:30:00', status: 'CANCELADA' });
    const tarde = consulta({ id: 3, dataHora: '2026-09-29T16:00:00', status: 'CONFIRMADA' });
    const cedo = consulta({ id: 4, dataHora: '2026-09-29T11:00:00' });
    const realizada = consulta({ id: 5, dataHora: '2026-09-29T10:15:00', status: 'REALIZADA' });

    expect(proximaConsulta([passada, cancelada, tarde, cedo, realizada], agora)?.id).toBe(4);
  });

  it('considera dias futuros e retorna null sem candidatas', () => {
    const amanha = consulta({ id: 7, dataHora: '2026-09-30T08:00:00' });
    expect(proximaConsulta([amanha], agora)?.id).toBe(7);
    expect(proximaConsulta([], agora)).toBeNull();
    expect(proximaConsulta([consulta({ dataHora: '2026-09-28T08:00:00' })], agora)).toBeNull();
  });

  it('inclui uma consulta exatamente no horário atual', () => {
    expect(proximaConsulta([consulta({ id: 9, dataHora: '2026-09-29T10:00:00' })], agora)?.id).toBe(
      9,
    );
  });
});

describe('consultasHoje e agendaHoje', () => {
  const lista = [
    consulta({ id: 1, dataHora: '2026-09-29T14:00:00' }),
    consulta({ id: 2, dataHora: '2026-09-29T08:00:00', status: 'REALIZADA' }),
    consulta({ id: 3, dataHora: '2026-09-29T11:00:00' }),
    consulta({ id: 4, dataHora: '2026-09-29T12:00:00', status: 'CANCELADA' }),
    consulta({ id: 5, dataHora: '2026-09-30T09:00:00' }),
  ];

  it('sessões de hoje excluem canceladas e outros dias, ordenadas por horário', () => {
    expect(consultasHoje(lista, agora).map((c) => c.id)).toEqual([2, 3, 1]);
  });

  it('agenda de hoje remove a consulta que está no destaque', () => {
    // A próxima é a das 11:00 (id 3).
    expect(agendaHoje(lista, agora).map((c) => c.id)).toEqual([2, 1]);
  });
});

describe('textos', () => {
  it('subtítulo mostra tipo e convênio (ou Particular)', () => {
    expect(subtitulo(consulta({ tipo: 'ONLINE', convenio: 'Unimed' }))).toBe('Online · Unimed');
    expect(subtitulo(consulta({ tipo: 'PRESENCIAL', convenio: null }))).toBe(
      'Presencial · Particular',
    );
    expect(tipoLabel(consulta({ tipo: 'ONLINE' }))).toBe('Online');
  });

  it('countdown segue as regras do Angular', () => {
    const em = (dataHora: string) => countdown(consulta({ dataHora }), agora);
    expect(em('2026-09-29T10:00:00')).toBe('agora');
    expect(em('2026-09-29T09:50:00')).toBe('agora');
    expect(em('2026-09-29T10:25:00')).toBe('em 25 min');
    expect(em('2026-09-29T12:05:00')).toBe('em 2h 5min');
    expect(em('2026-09-29T13:00:00')).toBe('em 3h');
    expect(em('2026-10-05T09:00:00')).toBe('05 de out.');
  });
});
