import { consulta, httpError, networkError } from '../../test/helpers';
import { MENSAGEM_SEM_CONEXAO } from '../../utils/mensagensErro';
import {
  ETAPAS,
  MAX_HISTORICO,
  alternarOpcao,
  etapaAnterior,
  etapaParaRetomar,
  formsDaConsulta,
  lerHistorico,
  limiteOutras,
  mensagemErroSalvar,
  montarAtualizacao,
  numeroDaEtapa,
  podeIrPara,
  proximaEtapa,
  serializarHistorico,
} from './wizardLogic';

const vazia = consulta();
const quadroSalvo = { ...vazia.quadroClinico, queixaPrincipal: '' };
const habitosSalvos = { ...vazia.habitosVida, atividadeFisica: '' };
const exameSalvo = { ...vazia.exameFisico, postura: '' };

describe('retomar na etapa certa ao reabrir (casos do spec do Angular, regressão do F-05)', () => {
  it('nada salvo ainda → quadro clínico', () => {
    expect(etapaParaRetomar(vazia)).toBe('quadro-clinico');
  });

  it('quadro clínico salvo (mesmo em branco: "" não é null) → hábitos de vida', () => {
    expect(etapaParaRetomar(consulta({ quadroClinico: quadroSalvo }))).toBe('habitos-vida');
  });

  it('quadro e hábitos salvos → exame físico', () => {
    expect(
      etapaParaRetomar(consulta({ quadroClinico: quadroSalvo, habitosVida: habitosSalvos })),
    ).toBe('exame-fisico');
  });

  it('três primeiras etapas salvas → diagnóstico', () => {
    expect(
      etapaParaRetomar(
        consulta({
          quadroClinico: quadroSalvo,
          habitosVida: habitosSalvos,
          exameFisico: exameSalvo,
        }),
      ),
    ).toBe('diagnostico');
  });

  it('consulta realizada → sucesso, mesmo sem dados clínicos', () => {
    expect(etapaParaRetomar(consulta({ status: 'REALIZADA' }))).toBe('sucesso');
  });

  it('um booleano salvo (false) também conta como etapa salva', () => {
    expect(
      etapaParaRetomar(consulta({ habitosVida: { ...vazia.habitosVida, tabagismo: false } })),
    ).toBe('exame-fisico');
  });
});

describe('navegação entre etapas', () => {
  it('numeroDaEtapa vai de 1 a 4 (stepNumber)', () => {
    expect(ETAPAS.slice(0, 4).map(numeroDaEtapa)).toEqual([1, 2, 3, 4]);
  });

  it('próxima e anterior', () => {
    expect(proximaEtapa('quadro-clinico')).toBe('habitos-vida');
    expect(proximaEtapa('diagnostico')).toBe('sucesso');
    expect(proximaEtapa('sucesso')).toBe('sucesso');
    expect(etapaAnterior('exame-fisico')).toBe('habitos-vida');
    expect(etapaAnterior('quadro-clinico')).toBeNull();
  });

  it('irParaEtapa: só para etapas anteriores, nunca para a frente nem para a mesma', () => {
    expect(podeIrPara('exame-fisico', 'quadro-clinico')).toBe(true);
    expect(podeIrPara('exame-fisico', 'habitos-vida')).toBe(true);
    expect(podeIrPara('exame-fisico', 'exame-fisico')).toBe(false);
    expect(podeIrPara('exame-fisico', 'diagnostico')).toBe(false);
  });
});

describe('histórico de saúde (chips + "Outras")', () => {
  it('lê chips fixos e o texto livre do que foi salvo', () => {
    expect(lerHistorico('Hipertensão, Fibromialgia, Asma, Artrite')).toEqual({
      opcoes: ['Hipertensão', 'Asma'],
      outrasAtivo: true,
      outras: 'Fibromialgia, Artrite',
    });
    expect(lerHistorico(null)).toEqual({ opcoes: [], outrasAtivo: false, outras: '' });
    expect(lerHistorico('Diabetes')).toEqual({
      opcoes: ['Diabetes'],
      outrasAtivo: false,
      outras: '',
    });
  });

  it('alterna um chip fixo, mantendo a ordem de marcação', () => {
    let h = lerHistorico('');
    h = alternarOpcao(h, 'Asma');
    h = alternarOpcao(h, 'Hipertensão');
    expect(h.opcoes).toEqual(['Asma', 'Hipertensão']);
    h = alternarOpcao(h, 'Asma');
    expect(h.opcoes).toEqual(['Hipertensão']);
  });

  it('serializa separado por ", ", com o texto livre (sem espaços nas pontas) no fim', () => {
    expect(
      serializarHistorico({ opcoes: ['Diabetes', 'Asma'], outrasAtivo: true, outras: ' Gota ' }),
    ).toBe('Diabetes, Asma, Gota');
    expect(serializarHistorico({ opcoes: [], outrasAtivo: true, outras: '  ' })).toBe('');
  });

  it('"Outras" desmarcado não envia o texto livre (no Angular ele ia escondido)', () => {
    expect(
      serializarHistorico({ opcoes: ['Asma'], outrasAtivo: false, outras: 'Fibromialgia' }),
    ).toBe('Asma');
  });

  it('ida e volta preserva o que foi salvo', () => {
    const texto = 'Hipertensão, Diabetes, Fibromialgia, Artrite';
    expect(serializarHistorico(lerHistorico(texto))).toBe(texto);
  });

  it('limite de "Outras" desconta os chips para caber nos 255 do backend', () => {
    expect(limiteOutras(lerHistorico(''))).toBe(MAX_HISTORICO);
    const h = lerHistorico('Hipertensão, Asma');
    const outras = 'x'.repeat(limiteOutras(h));
    expect(serializarHistorico({ ...h, outrasAtivo: true, outras })).toHaveLength(MAX_HISTORICO);
  });
});

describe('formulários e corpo do PUT', () => {
  const salva = consulta({
    id: 7,
    dataHora: '2026-09-30T14:30:00',
    tipo: 'ONLINE',
    status: 'CONFIRMADA',
    convenio: 'Unimed',
    valor: 150.5,
    quadroClinico: {
      queixaPrincipal: 'Dor lombar',
      historiaDoencaAtual: null,
      historicoSaude: 'Asma, Fibromialgia',
      cirurgias: true,
      cirurgiasDescricao: 'Joelho',
      lesoesAnteriores: null,
      lesoesAnterioresDescricao: null,
      medicamentos: null,
    },
  });
  const forms = formsDaConsulta(salva);
  const base = {
    dataHora: '2026-09-30T14:30:00',
    tipo: 'ONLINE',
    status: 'CONFIRMADA',
    convenio: 'Unimed',
    valor: 150.5,
  };

  it('preenche os formulários trocando null por "" e false', () => {
    expect(forms.quadro).toEqual({
      queixaPrincipal: 'Dor lombar',
      historiaDoencaAtual: '',
      historico: { opcoes: ['Asma'], outrasAtivo: true, outras: 'Fibromialgia' },
      cirurgias: true,
      cirurgiasDescricao: 'Joelho',
      lesoesAnteriores: false,
      lesoesAnterioresDescricao: '',
      medicamentos: '',
    });
    expect(forms.habitos).toEqual({
      atividadeFisica: '',
      rotinaTrabalho: '',
      tabagismo: false,
      consumoAlcool: false,
    });
    expect(forms.diagnostico).toEqual({ planoTratamento: '', objetivosTratamento: '' });
  });

  it('quadro clínico: dados-base intactos (dataHora igual, para não virar remarcação) + só o bloco da etapa', () => {
    expect(montarAtualizacao(salva, 'quadro-clinico', forms)).toEqual({
      ...base,
      quadroClinico: {
        queixaPrincipal: 'Dor lombar',
        historiaDoencaAtual: '',
        historicoSaude: 'Asma, Fibromialgia',
        cirurgias: true,
        cirurgiasDescricao: 'Joelho',
        lesoesAnteriores: false,
        lesoesAnterioresDescricao: '',
        medicamentos: '',
      },
    });
  });

  it('hábitos e exame físico mandam só o próprio bloco', () => {
    const habitos = montarAtualizacao(salva, 'habitos-vida', forms);
    expect(habitos).toEqual({ ...base, habitosVida: forms.habitos });
    expect(habitos).not.toHaveProperty('quadroClinico');

    const exame = montarAtualizacao(salva, 'exame-fisico', forms);
    expect(exame).toEqual({ ...base, exameFisico: forms.exame });
    expect(exame).not.toHaveProperty('diagnostico');
  });

  it('diagnóstico finaliza a consulta (status REALIZADA)', () => {
    expect(montarAtualizacao(salva, 'diagnostico', forms)).toEqual({
      ...base,
      status: 'REALIZADA',
      diagnostico: forms.diagnostico,
    });
  });

  it('a etapa de sucesso não tem o que salvar', () => {
    expect(() => montarAtualizacao(salva, 'sucesso', forms)).toThrow();
  });
});

describe('mensagens de erro', () => {
  it('ao salvar: a do Angular, e a de sem conexão para erro de rede', () => {
    expect(mensagemErroSalvar(httpError(500))).toBe('Não foi possível salvar. Tente novamente.');
    expect(mensagemErroSalvar(httpError(400))).toBe('Não foi possível salvar. Tente novamente.');
    expect(mensagemErroSalvar(networkError())).toBe(MENSAGEM_SEM_CONEXAO);
  });
});
