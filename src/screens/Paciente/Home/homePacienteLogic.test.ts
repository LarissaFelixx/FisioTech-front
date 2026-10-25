import { consulta } from '../../../test/helpers';
import type { MinhaConversaItem } from '../../../types/mensagem';
import {
  destaqueConsulta,
  proximaConsulta,
  resumoConsultas,
  temMensagemNova,
} from './homePacienteLogic';

const agora = new Date(2025, 7, 20, 10, 0);

describe('proximaConsulta', () => {
  it('pega a agendada ou confirmada mais próxima que ainda não passou', () => {
    const lista = [
      consulta({ id: 1, dataHora: '2025-08-25T09:00:00', status: 'AGENDADA' }),
      consulta({ id: 2, dataHora: '2025-08-22T09:00:00', status: 'CONFIRMADA' }),
      consulta({ id: 3, dataHora: '2025-08-19T09:00:00', status: 'AGENDADA' }),
      consulta({ id: 4, dataHora: '2025-08-21T09:00:00', status: 'CANCELADA' }),
      consulta({ id: 5, dataHora: '2025-08-20T09:30:00', status: 'REALIZADA' }),
    ];
    expect(proximaConsulta(lista, agora)?.id).toBe(2);
  });

  it('conta a consulta de daqui a pouco, mas não a de mais cedo no mesmo dia', () => {
    const lista = [
      consulta({ id: 1, dataHora: '2025-08-20T09:00:00' }),
      consulta({ id: 2, dataHora: '2025-08-20T11:00:00' }),
    ];
    expect(proximaConsulta(lista, agora)?.id).toBe(2);
  });

  it('é nula sem consulta futura em aberto', () => {
    expect(proximaConsulta([], agora)).toBeNull();
    expect(
      proximaConsulta([consulta({ dataHora: '2025-08-30T09:00:00', status: 'REALIZADA' })], agora),
    ).toBeNull();
  });
});

describe('resumoConsultas', () => {
  it('conta todas e as em aberto (agendadas e confirmadas), no singular e no plural', () => {
    expect(
      resumoConsultas([
        consulta({ status: 'CONFIRMADA' }),
        consulta({ status: 'REALIZADA' }),
        consulta({ status: 'REALIZADA' }),
        consulta({ status: 'CANCELADA' }),
      ]),
    ).toBe('4 consultas · 1 agendada');
    expect(resumoConsultas([consulta({ status: 'REALIZADA' })])).toBe('1 consulta · 0 agendadas');
    expect(
      resumoConsultas([consulta({ status: 'AGENDADA' }), consulta({ status: 'CONFIRMADA' })]),
    ).toBe('2 consultas · 2 agendadas');
  });
});

describe('destaqueConsulta', () => {
  it('monta o dia, o mês com a hora e o profissional com a modalidade', () => {
    expect(
      destaqueConsulta(
        consulta({ dataHora: '2025-08-22T09:00:00', profissionalNome: 'Ana Souza' }),
      ),
    ).toEqual({ dia: '22', mesHora: 'ago · 09:00', detalhe: 'Ana Souza · Presencial' });
    expect(
      destaqueConsulta(
        consulta({ dataHora: '2025-03-05T14:30:00', tipo: 'ONLINE', profissionalNome: 'Bruno' }),
      ),
    ).toEqual({ dia: '05', mesHora: 'mar · 14:30', detalhe: 'Bruno · Online' });
  });
});

describe('temMensagemNova', () => {
  const conversa = (ultimoAutor: MinhaConversaItem['ultimoAutor']): MinhaConversaItem => ({
    profissionalId: 1,
    profissionalNome: 'Ana',
    ultimaMensagem: 'Oi',
    ultimoAutor,
    dataUltimaMensagem: '2025-08-20T09:00:00',
  });

  it('só quando alguma conversa terminou com o profissional', () => {
    expect(temMensagemNova([conversa('PACIENTE'), conversa('PROFISSIONAL')])).toBe(true);
    expect(temMensagemNova([conversa('PACIENTE'), conversa(null)])).toBe(false);
    expect(temMensagemNova([])).toBe(false);
  });
});
