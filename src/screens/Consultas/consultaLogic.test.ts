import { consulta, httpError } from '../../test/helpers';
import type { Paciente } from '../../types/paciente';
import { validarFormulario } from '../../utils/validation';
import {
  CONSULTA_VAZIA,
  agruparPorDia,
  estrelas,
  filtrarConsultas,
  filtrarPorNome,
  mensagemErroCadastroRapido,
  mensagemErroCriarConsulta,
  montarConsulta,
  schemaConsulta,
  secoesProntuario,
} from './consultaLogic';

describe('filtros da lista (mesmas regras do Angular)', () => {
  const lista = [
    consulta({ id: 1, status: 'AGENDADA' }),
    consulta({ id: 2, status: 'CONFIRMADA' }),
    consulta({ id: 3, status: 'CANCELADA' }),
    consulta({ id: 4, status: 'REALIZADA', foiRemarcada: true }),
  ];
  const ids = (f: Parameters<typeof filtrarConsultas>[1]) =>
    filtrarConsultas(lista, f).map((c) => c.id);

  it('todas, agendadas (agendada + confirmada), canceladas e remarcadas', () => {
    expect(ids('todas')).toEqual([1, 2, 3, 4]);
    expect(ids('agendadas')).toEqual([1, 2]);
    expect(ids('canceladas')).toEqual([3]);
    expect(ids('remarcadas')).toEqual([4]);
  });
});

describe('agruparPorDia', () => {
  it('dias mais recentes primeiro; horários em ordem crescente; rótulo por extenso', () => {
    const grupos = agruparPorDia([
      consulta({ id: 1, dataHora: '2026-09-28T10:00:00' }),
      consulta({ id: 2, dataHora: '2026-09-29T15:00:00' }),
      consulta({ id: 3, dataHora: '2026-09-29T08:30:00' }),
    ]);

    expect(grupos.map((g) => g.data)).toEqual(['2026-09-29', '2026-09-28']);
    expect(grupos[0].label).toBe('TERÇA-FEIRA, 29 DE SETEMBRO');
    expect(grupos[0].consultas.map((c) => c.id)).toEqual([3, 2]);
  });
});

describe('nova consulta', () => {
  it('busca de paciente só pelo nome', () => {
    const pacientes = [
      { id: 1, nome: 'Maria', email: 'joao@x.com' },
      { id: 2, nome: 'João', email: 'j@x.com' },
    ] as Paciente[];
    expect(filtrarPorNome(pacientes, 'joão').map((p) => p.id)).toEqual([2]);
    expect(filtrarPorNome(pacientes, '')).toHaveLength(2);
  });

  it('exige data e hora válidas e valor numérico', () => {
    expect(validarFormulario(CONSULTA_VAZIA, schemaConsulta)).toEqual({
      data: 'Este campo é obrigatório.',
      hora: 'Este campo é obrigatório.',
    });
    expect(
      validarFormulario(
        { ...CONSULTA_VAZIA, data: '31/02/2026', hora: '25:00', valor: 'abc' },
        schemaConsulta,
      ),
    ).toEqual({
      data: 'Data inválida. Use DD/MM/AAAA.',
      hora: 'Horário inválido. Use HH:MM.',
      valor: 'Valor inválido. Use, por exemplo, 150 ou 150,50.',
    });
  });

  it('monta a requisição como o Angular (convênio vazio e valor vazio viram null)', () => {
    expect(
      montarConsulta(7, {
        data: '30/09/2026',
        hora: '14:30',
        tipo: 'ONLINE',
        convenio: '  ',
        valor: '',
      }),
    ).toEqual({
      pacienteId: 7,
      dataHora: '2026-09-30T14:30:00',
      tipo: 'ONLINE',
      convenio: null,
      valor: null,
    });
    expect(
      montarConsulta(7, {
        data: '30/09/2026',
        hora: '09:00',
        tipo: 'PRESENCIAL',
        convenio: ' Unimed ',
        valor: '150,50',
      }),
    ).toMatchObject({ convenio: 'Unimed', valor: 150.5 });
  });

  it('mensagens de erro', () => {
    expect(mensagemErroCriarConsulta(httpError(500))).toBe('Não foi possível criar a consulta.');
    expect(mensagemErroCadastroRapido(httpError(409))).toBe(
      'Já existe um paciente cadastrado com este email.',
    );
    expect(mensagemErroCadastroRapido(httpError(400))).toBe(
      'Não foi possível cadastrar. Tente novamente.',
    );
  });
});

describe('prontuário', () => {
  it('sem registro clínico, nenhuma seção', () => {
    expect(secoesProntuario(consulta())).toEqual([]);
  });

  it('mostra só os campos preenchidos, inclusive cirurgias e lesões', () => {
    const c = consulta({
      quadroClinico: {
        queixaPrincipal: 'Dor lombar',
        historiaDoencaAtual: null,
        historicoSaude: 'Hipertensão',
        cirurgias: true,
        cirurgiasDescricao: 'Joelho (2019)',
        lesoesAnteriores: true,
        lesoesAnterioresDescricao: '',
        medicamentos: null,
      },
      habitosVida: {
        atividadeFisica: null,
        rotinaTrabalho: null,
        tabagismo: false,
        consumoAlcool: null,
      },
    });

    expect(secoesProntuario(c)).toEqual([
      {
        titulo: 'Quadro Clínico',
        linhas: [
          { rotulo: 'Queixa principal', valor: 'Dor lombar' },
          { rotulo: 'Histórico de saúde', valor: 'Hipertensão' },
          { rotulo: 'Cirurgias', valor: 'Joelho (2019)' },
          { rotulo: 'Lesões anteriores', valor: 'Sim' },
        ],
      },
      { titulo: 'Hábitos de Vida', linhas: [{ rotulo: 'Tabagismo', valor: 'Não' }] },
    ]);
  });

  it('seção aparece mesmo quando só o histórico de saúde está preenchido (o Angular escondia)', () => {
    const c = consulta({
      quadroClinico: { ...consulta().quadroClinico, historicoSaude: 'Asma' },
    });
    expect(secoesProntuario(c).map((s) => s.titulo)).toEqual(['Quadro Clínico']);
  });

  it('estrelas da avaliação', () => {
    expect(estrelas(4)).toBe('★★★★☆');
    expect(estrelas(5)).toBe('★★★★★');
    expect(estrelas(1)).toBe('★☆☆☆☆');
  });
});
