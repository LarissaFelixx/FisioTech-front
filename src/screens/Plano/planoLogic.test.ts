import { httpError, networkError } from '../../test/helpers';
import type { PlanoTerapeutico } from '../../types/plano';
import { MENSAGEM_SEM_CONEXAO } from '../../utils/mensagensErro';
import { MENSAGENS } from '../../utils/validation';
import {
  MENSAGEM_ERRO_SALVAR,
  MENSAGEM_FIM_ANTES_INICIO,
  formDoPlano,
  mensagemErroSalvar,
  montarPlano,
  planoParaPreencher,
  validarPlano,
  type PlanoForm,
} from './planoLogic';

const plano = (parcial: Partial<PlanoTerapeutico>): PlanoTerapeutico => ({
  id: 1,
  pacienteId: 10,
  profissionalId: 1,
  profissionalNome: 'Dra. Ana',
  revisao: 1,
  objetivos: 'Reduzir a dor',
  condutas: 'Fortalecimento',
  dataInicio: '2025-08-22',
  dataFimPrevista: '2025-09-30',
  status: 'SUBSTITUIDO',
  visivelPaciente: true,
  dataCriacao: '2025-08-22T10:00:00',
  ...parcial,
});

const valido: PlanoForm = {
  objetivos: 'Reduzir a dor',
  condutas: 'Fortalecimento',
  dataInicio: '22/08/2025',
  dataFimPrevista: '30/09/2025',
  visivelPaciente: true,
};

describe('plano para pré-preencher', () => {
  it('usa o ATIVO, mesmo que não seja o de maior revisão', () => {
    const ativo = plano({ id: 2, revisao: 2, status: 'ATIVO' });
    expect(planoParaPreencher([plano({ id: 3, revisao: 3, status: 'ENCERRADO' }), ativo])).toBe(
      ativo,
    );
  });

  it('sem ATIVO, usa o de maior revisão', () => {
    const r2 = plano({ id: 2, revisao: 2 });
    expect(planoParaPreencher([plano({ revisao: 1 }), r2])).toBe(r2);
  });

  it('sem planos, nenhum', () => {
    expect(planoParaPreencher([])).toBeNull();
  });
});

describe('formulário do plano', () => {
  it('converte as datas do plano para DD/MM/AAAA', () => {
    expect(
      formDoPlano(plano({ visivelPaciente: false, dataFimPrevista: null }), new Date()),
    ).toEqual({
      objetivos: 'Reduzir a dor',
      condutas: 'Fortalecimento',
      dataInicio: '22/08/2025',
      dataFimPrevista: '',
      visivelPaciente: false,
    });
  });

  it('sem plano: vazio, início hoje e visível', () => {
    expect(formDoPlano(null, new Date(2026, 9, 25))).toEqual({
      objetivos: '',
      condutas: '',
      dataInicio: '25/10/2026',
      dataFimPrevista: '',
      visivelPaciente: true,
    });
  });
});

describe('validação do plano', () => {
  it('formulário válido', () => {
    expect(validarPlano(valido)).toEqual({});
    expect(validarPlano({ ...valido, dataFimPrevista: '' })).toEqual({});
  });

  it('objetivos, condutas e início são obrigatórios', () => {
    expect(validarPlano({ ...valido, objetivos: ' ', condutas: '', dataInicio: '' })).toEqual({
      objetivos: MENSAGENS.obrigatorio,
      condutas: MENSAGENS.obrigatorio,
      dataInicio: MENSAGENS.obrigatorio,
    });
  });

  it('limite de 4000 caracteres', () => {
    expect(validarPlano({ ...valido, objetivos: 'a'.repeat(4001) })).toEqual({
      objetivos: MENSAGENS.maximo(4000),
    });
  });

  it('datas inválidas', () => {
    expect(validarPlano({ ...valido, dataInicio: '31/02/2025', dataFimPrevista: '1/1' })).toEqual({
      dataInicio: MENSAGENS.data,
      dataFimPrevista: MENSAGENS.data,
    });
  });

  it('término não pode ser anterior ao início (mesmo dia pode)', () => {
    expect(validarPlano({ ...valido, dataFimPrevista: '21/08/2025' })).toEqual({
      dataFimPrevista: MENSAGEM_FIM_ANTES_INICIO,
    });
    expect(validarPlano({ ...valido, dataFimPrevista: '22/08/2025' })).toEqual({});
  });
});

describe('requisição e erros', () => {
  it('converte as datas para AAAA-MM-DD e apara os textos', () => {
    expect(montarPlano({ ...valido, objetivos: '  Reduzir a dor  ' })).toEqual({
      objetivos: 'Reduzir a dor',
      condutas: 'Fortalecimento',
      dataInicio: '2025-08-22',
      dataFimPrevista: '2025-09-30',
      visivelPaciente: true,
    });
    expect(montarPlano({ ...valido, dataFimPrevista: '' }).dataFimPrevista).toBeNull();
  });

  it('mensagens de erro ao salvar', () => {
    expect(mensagemErroSalvar(httpError(400))).toBe('Verifique os dados do plano.');
    expect(mensagemErroSalvar(httpError(404))).toBe('Paciente não encontrado.');
    expect(mensagemErroSalvar(httpError(409))).toBe(MENSAGEM_FIM_ANTES_INICIO);
    expect(mensagemErroSalvar(httpError(422))).toBe(MENSAGEM_FIM_ANTES_INICIO);
    expect(mensagemErroSalvar(httpError(500))).toBe(MENSAGEM_ERRO_SALVAR);
    expect(mensagemErroSalvar(networkError())).toBe(MENSAGEM_SEM_CONEXAO);
  });
});
