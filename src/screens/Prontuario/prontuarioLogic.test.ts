import { consulta, httpError, networkError } from '../../test/helpers';
import type { EvolucaoClinica, PlanoTerapeutico } from '../../types/prontuario';
import {
  cabecalhoEvolucao,
  consultasPorId,
  pacienteNaoEncontrado,
  rodapePlano,
  seloEvolucao,
  seloPlano,
  versoesAnteriores,
} from './prontuarioLogic';

const plano = (p: Partial<PlanoTerapeutico>): PlanoTerapeutico => ({
  id: 1,
  pacienteId: 12,
  profissionalId: 1,
  profissionalNome: 'Dra. Ana',
  revisao: 1,
  objetivos: 'Reduzir a dor',
  condutas: 'Fortalecimento',
  dataInicio: '2025-08-12',
  dataFimPrevista: '2025-09-30',
  status: 'ATIVO',
  visivelPaciente: true,
  dataCriacao: '2025-08-12T10:00:00',
  ...p,
});

const evolucao = (e: Partial<EvolucaoClinica>): EvolucaoClinica => ({
  id: 1,
  pacienteId: 12,
  profissionalId: 1,
  profissionalNome: 'Dra. Ana',
  consultaId: null,
  observacoes: 'Melhora',
  procedimentos: null,
  respostaPaciente: null,
  conduta: null,
  visivelPaciente: true,
  dataRegistro: '2025-08-22T10:32:00',
  ...e,
});

describe('prontuário do profissional', () => {
  it('selo do plano com status e versão', () => {
    expect(seloPlano(plano({ revisao: 2 }))).toBe('Ativo · v2');
    expect(seloPlano(plano({ revisao: 1, status: 'SUBSTITUIDO' }))).toBe('Substituído · v1');
    expect(seloPlano(plano({ revisao: 3, status: 'ENCERRADO' }))).toBe('Encerrado · v3');
  });

  it('rodapé do plano com período e visibilidade', () => {
    expect(rodapePlano(plano({}))).toBe(
      'Início 12/08/2025 · Previsão 30/09/2025 · Visível ao paciente',
    );
    expect(rodapePlano(plano({ dataFimPrevista: null, visivelPaciente: false }))).toBe(
      'Início 12/08/2025 · Privado',
    );
  });

  it('versões anteriores: todas menos a exibida, da mais nova para a mais antiga', () => {
    const v1 = plano({ id: 1, revisao: 1, status: 'SUBSTITUIDO' });
    const v2 = plano({ id: 2, revisao: 2, status: 'SUBSTITUIDO' });
    const v3 = plano({ id: 3, revisao: 3 });
    expect(versoesAnteriores([v1, v3, v2], v3)).toEqual([v2, v1]);
    expect(versoesAnteriores([v1], v1)).toEqual([]);
    expect(versoesAnteriores([], null)).toEqual([]);
  });

  it('cabeçalho da evolução usa o horário da consulta de origem', () => {
    const mapa = consultasPorId([consulta({ id: 7, dataHora: '2025-08-22T09:00:00' })]);
    expect(cabecalhoEvolucao(evolucao({ consultaId: 7 }), mapa)).toBe(
      '22/08/2025 · Consulta 09:00',
    );
  });

  it('sem a consulta (avulsa, excluída ou lista indisponível), usa o registro', () => {
    const vazio = consultasPorId(undefined);
    expect(cabecalhoEvolucao(evolucao({ consultaId: null }), vazio)).toBe(
      '22/08/2025 · Registro 10:32',
    );
    expect(cabecalhoEvolucao(evolucao({ consultaId: 99 }), vazio)).toBe(
      '22/08/2025 · Registro 10:32',
    );
  });

  it('selo da evolução', () => {
    expect(seloEvolucao(evolucao({}))).toBe('Visível ao paciente');
    expect(seloEvolucao(evolucao({ visivelPaciente: false }))).toBe('Privada');
  });

  it('só o 404 conta como paciente não encontrado', () => {
    expect(pacienteNaoEncontrado(httpError(404))).toBe(true);
    expect(pacienteNaoEncontrado(httpError(500))).toBe(false);
    expect(pacienteNaoEncontrado(httpError(403))).toBe(false);
    expect(pacienteNaoEncontrado(networkError())).toBe(false);
  });
});
