import { consulta, httpError, networkError } from '../../test/helpers';
import { MENSAGEM_SEM_CONEXAO } from '../../utils/mensagensErro';
import { MENSAGENS } from '../../utils/validation';
import {
  FORM_VAZIO,
  MENSAGEM_ERRO_REGISTRAR,
  erroObservacoes,
  mensagemErroRegistrar,
  montarEvolucao,
  subtituloEvolucao,
} from './evolucaoLogic';

describe('nova evolução', () => {
  it('subtítulo com o paciente e a data da consulta', () => {
    const c = consulta({ pacienteNome: 'Marcos Coelho', dataHora: '2026-08-22T09:00:00' });
    expect(subtituloEvolucao(c)).toBe('Marcos Coelho · consulta de 22/08 09:00');
  });

  it('observações são obrigatórias', () => {
    expect(erroObservacoes(FORM_VAZIO)).toBe(MENSAGENS.obrigatorio);
    expect(erroObservacoes({ ...FORM_VAZIO, observacoes: '   ' })).toBe(MENSAGENS.obrigatorio);
    expect(erroObservacoes({ ...FORM_VAZIO, observacoes: 'Melhora' })).toBeNull();
  });

  it('monta a requisição: textos aparados e campos vazios como null', () => {
    expect(
      montarEvolucao(7, {
        observacoes: '  Melhora da dor  ',
        procedimentos: 'Isometria',
        respostaPaciente: '  ',
        conduta: '',
        visivelPaciente: false,
      }),
    ).toEqual({
      consultaId: 7,
      observacoes: 'Melhora da dor',
      procedimentos: 'Isometria',
      respostaPaciente: null,
      conduta: null,
      visivelPaciente: false,
    });
  });

  it('visível para o paciente por padrão', () => {
    expect(FORM_VAZIO.visivelPaciente).toBe(true);
  });

  it('mensagens de erro ao registrar', () => {
    expect(mensagemErroRegistrar(httpError(400))).toBe('Verifique os dados da evolução.');
    expect(mensagemErroRegistrar(httpError(404))).toBe('Paciente ou consulta não encontrado.');
    expect(mensagemErroRegistrar(httpError(500))).toBe(MENSAGEM_ERRO_REGISTRAR);
    expect(mensagemErroRegistrar(networkError())).toBe(MENSAGEM_SEM_CONEXAO);
  });
});
