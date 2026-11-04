import { httpError, networkError } from '../../../test/helpers';
import type { ProfissionalBusca } from '../../../types/consultaBooking';
import { MENSAGEM_SEM_CONEXAO } from '../../../utils/mensagensErro';
import {
  MENSAGEM_HORARIO_OCUPADO,
  dataIso,
  filtrarProfissionais,
  horariosDoDia,
  mensagemErroMarcar,
  pedidoConsulta,
  podeConfirmar,
  proximosDias,
  quandoCurto,
} from './marcarConsultaLogic';

const profissional = (parcial: Partial<ProfissionalBusca>): ProfissionalBusca => ({
  id: 1,
  nome: 'Ana Souza',
  especialidade: 'Ortopedia',
  valorConsultaParticular: 180,
  conveniosAceitos: [],
  ...parcial,
});

describe('filtrarProfissionais', () => {
  const lista = [
    profissional({ id: 1, nome: 'Ana Souza', especialidade: 'Ortopedia' }),
    profissional({ id: 2, nome: 'Bruno Farias', especialidade: 'Neurofuncional' }),
    profissional({ id: 3, nome: 'Camila Mendes', especialidade: 'Pediátrica' }),
  ];

  it('busca por nome ou especialidade, sem acento nem caixa', () => {
    expect(filtrarProfissionais(lista, 'ana').map((p) => p.id)).toEqual([1]);
    expect(filtrarProfissionais(lista, ' NEURO ').map((p) => p.id)).toEqual([2]);
    expect(filtrarProfissionais(lista, 'pediatrica').map((p) => p.id)).toEqual([3]);
    expect(filtrarProfissionais(lista, 'xyz')).toEqual([]);
  });

  it('busca vazia devolve todos', () => {
    expect(filtrarProfissionais(lista, '  ')).toHaveLength(3);
  });
});

describe('dias e horários', () => {
  it('dataIso usa a hora local', () => {
    expect(dataIso(new Date(2025, 7, 5, 23, 59))).toBe('2025-08-05');
  });

  it('proximosDias começa hoje e atravessa o mês', () => {
    const dias = proximosDias(new Date(2025, 7, 30, 15, 0), 4);
    expect(dias).toEqual([
      { iso: '2025-08-30', semana: 'SÁB', dia: '30' },
      { iso: '2025-08-31', semana: 'DOM', dia: '31' },
      { iso: '2025-09-01', semana: 'SEG', dia: '01' },
      { iso: '2025-09-02', semana: 'TER', dia: '02' },
    ]);
    expect(proximosDias(new Date(2025, 7, 30))).toHaveLength(14);
  });

  it('horariosDoDia desabilita os ocupados e os que já passaram', () => {
    const disponibilidade = {
      data: '2025-08-22',
      horarios: [
        { horario: '08:00:00', disponivel: true },
        { horario: '09:00:00', disponivel: true },
        { horario: '10:00:00', disponivel: false },
      ],
    };
    expect(horariosDoDia(disponibilidade, '2025-08-22', new Date(2025, 7, 22, 8, 30))).toEqual([
      { valor: '08:00:00', label: '08:00', habilitado: false },
      { valor: '09:00:00', label: '09:00', habilitado: true },
      { valor: '10:00:00', label: '10:00', habilitado: false },
    ]);
    // Em outro dia, nada passou.
    expect(
      horariosDoDia(disponibilidade, '2025-08-23', new Date(2025, 7, 22, 8, 30))[0].habilitado,
    ).toBe(true);
  });

  it('quandoCurto monta "22 ago, 09:00"', () => {
    expect(quandoCurto('2025-08-22', '09:00:00')).toBe('22 ago, 09:00');
    expect(quandoCurto('2025-12-05', '14:30')).toBe('05 dez, 14:30');
  });
});

describe('confirmação e pedido', () => {
  const base = {
    dia: '2025-08-22',
    horario: '09:00:00',
    tipo: 'PRESENCIAL' as const,
    forma: 'particular' as const,
    convenio: null,
  };

  it('podeConfirmar exige horário e, no convênio, um convênio', () => {
    expect(podeConfirmar(base)).toBe(true);
    expect(podeConfirmar({ ...base, horario: null })).toBe(false);
    expect(podeConfirmar({ ...base, forma: 'convenio' })).toBe(false);
    expect(podeConfirmar({ ...base, forma: 'convenio', convenio: 'Unimed' })).toBe(true);
  });

  it('pedidoConsulta monta o corpo do POST /me/consultas', () => {
    expect(pedidoConsulta(1, base)).toEqual({
      profissionalId: 1,
      dataHora: '2025-08-22T09:00:00',
      tipo: 'PRESENCIAL',
      convenio: null,
    });
    expect(
      pedidoConsulta(2, { ...base, tipo: 'ONLINE', forma: 'convenio', convenio: 'Unimed' }),
    ).toEqual({
      profissionalId: 2,
      dataHora: '2025-08-22T09:00:00',
      tipo: 'ONLINE',
      convenio: 'Unimed',
    });
  });

  it('particular nunca leva convênio, mesmo que um tenha ficado escolhido', () => {
    expect(pedidoConsulta(1, { ...base, convenio: 'Unimed' }).convenio).toBeNull();
  });
});

describe('mensagemErroMarcar', () => {
  it('traduz 409, falta de conexão e os demais erros', () => {
    expect(mensagemErroMarcar(httpError(409))).toBe(MENSAGEM_HORARIO_OCUPADO);
    expect(mensagemErroMarcar(networkError())).toBe(MENSAGEM_SEM_CONEXAO);
    expect(mensagemErroMarcar(httpError(500))).toBe(
      'Não foi possível marcar a consulta. Tente novamente.',
    );
  });
});
