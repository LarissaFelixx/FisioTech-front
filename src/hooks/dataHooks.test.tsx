import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { avaliacaoService } from '../services/avaliacaoService';
import { consultaService } from '../services/consultaService';
import { mensagemService } from '../services/mensagemService';
import { meService } from '../services/meService';
import { pacienteAdminService, pacienteService } from '../services/pacienteService';
import { profissionalService } from '../services/profissionalService';
import {
  consulta,
  createTestQueryClient,
  httpError,
  networkError,
  Providers,
} from '../test/helpers';
import { queryKeys } from './queryKeys';
import { nuloSeNaoEncontrado, useAvaliacaoDaConsulta } from './useAvaliacoes';
import {
  useAtualizarConsulta,
  useConsulta,
  useConsultas,
  useCriarConsulta,
  useDeletarConsulta,
} from './useConsultas';
import { useCaixaEntrada, useConversaComPaciente, useEnviarMensagem } from './useMensagens';
import {
  useAtualizarMeuPerfil,
  useAvaliarConsulta,
  useBuscarProfissionais,
  useCancelarConsulta,
  useDisponibilidade,
  useEnviarMinhaMensagem,
  useMarcarConsulta,
  useMinhaAvaliacao,
  useMinhasConsultas,
  useRemarcarConsulta,
} from './useMe';
import {
  useAtualizarPaciente,
  useAtualizarPacienteAdmin,
  useCriarPaciente,
  useDeletarPaciente,
  usePaciente,
  usePacientes,
  usePacientesAdmin,
} from './usePacientes';
import {
  useAtualizarProfissional,
  useCriarProfissional,
  useDeletarProfissional,
  useProfissionais,
} from './useProfissionais';

jest.mock('../services/consultaService');
jest.mock('../services/pacienteService');
jest.mock('../services/profissionalService');
jest.mock('../services/mensagemService');
jest.mock('../services/avaliacaoService');
jest.mock('../services/meService');

let queryClient: QueryClient;
let invalidadas: unknown[][];

function wrapper({ children }: { children: ReactNode }) {
  return <Providers queryClient={queryClient}>{children}</Providers>;
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = createTestQueryClient();
  invalidadas = [];
  const original = queryClient.invalidateQueries.bind(queryClient);
  jest.spyOn(queryClient, 'invalidateQueries').mockImplementation((filtros, opcoes) => {
    invalidadas.push([...(filtros?.queryKey ?? [])]);
    return original(filtros, opcoes);
  });
});

async function executar<T>(
  hook: () => { mutateAsync: (v: T) => Promise<unknown>; isSuccess: boolean },
  valor: T,
) {
  const { result } = await renderHook(hook, { wrapper });
  await act(async () => {
    await result.current.mutateAsync(valor);
  });
  // Espera as notificações do TanStack (agrupadas num setTimeout) chegarem ao hook.
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
}

describe('queries chamam o service certo', () => {
  it.each([
    ['useConsultas()', () => useConsultas(), consultaService.listarTodos, [undefined]],
    ['useConsultas(5)', () => useConsultas(5), consultaService.listarTodos, [5]],
    ['useConsulta(8)', () => useConsulta(8), consultaService.buscarPorId, [8]],
    ['usePacientes', () => usePacientes(), pacienteService.listarTodos, []],
    ['usePaciente(3)', () => usePaciente(3), pacienteService.buscarPorId, [3]],
    ['usePacientesAdmin', () => usePacientesAdmin(), pacienteAdminService.listarTodos, []],
    ['useProfissionais', () => useProfissionais(), profissionalService.listarTodos, []],
    ['useCaixaEntrada', () => useCaixaEntrada(), mensagemService.caixaEntrada, []],
    [
      'useConversaComPaciente',
      () => useConversaComPaciente(5),
      mensagemService.listarPorPaciente,
      [5],
    ],
    ['useMinhasConsultas', () => useMinhasConsultas(), meService.minhasConsultas, []],
    [
      'useBuscarProfissionais',
      () => useBuscarProfissionais('Bia', 'Orto'),
      meService.buscarProfissionais,
      ['Bia', 'Orto'],
    ],
  ] as const)('%s', async (_nome, hook, service, argumentos) => {
    jest.mocked(service as jest.Mock).mockResolvedValue(['dados']);

    const { result } = await renderHook(hook as () => { isSuccess: boolean; data: unknown }, {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(service).toHaveBeenCalledWith(...argumentos);
    expect(result.current.data).toEqual(['dados']);
  });

  it('useDisponibilidade só busca com profissional e data', async () => {
    jest
      .mocked(meService.buscarDisponibilidade)
      .mockResolvedValue({ data: '2026-10-01', horarios: [] });

    const semData = await renderHook(() => useDisponibilidade(4, null), { wrapper });
    expect(semData.result.current.fetchStatus).toBe('idle');
    const semProfissional = await renderHook(() => useDisponibilidade(null, '2026-10-01'), {
      wrapper,
    });
    expect(semProfissional.result.current.fetchStatus).toBe('idle');
    expect(meService.buscarDisponibilidade).not.toHaveBeenCalled();

    const completo = await renderHook(() => useDisponibilidade(4, '2026-10-01'), { wrapper });
    await waitFor(() => expect(completo.result.current.isSuccess).toBe(true));
    expect(meService.buscarDisponibilidade).toHaveBeenCalledWith(4, '2026-10-01');
  });
});

describe('avaliação: 404 significa "ainda não avaliada"', () => {
  it('nuloSeNaoEncontrado converte só o 404 em null', async () => {
    await expect(nuloSeNaoEncontrado(async () => 'ok')).resolves.toBe('ok');
    await expect(
      nuloSeNaoEncontrado(async () => {
        throw httpError(404);
      }),
    ).resolves.toBeNull();
    await expect(
      nuloSeNaoEncontrado(async () => {
        throw httpError(500);
      }),
    ).rejects.toMatchObject({ response: { status: 500 } });
    await expect(
      nuloSeNaoEncontrado(async () => {
        throw networkError();
      }),
    ).rejects.toMatchObject({ code: 'ERR_NETWORK' });
  });

  it('useAvaliacaoDaConsulta devolve null quando não há avaliação', async () => {
    jest.mocked(avaliacaoService.buscarPorConsulta).mockRejectedValue(httpError(404));

    const { result } = await renderHook(() => useAvaliacaoDaConsulta(8), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('useMinhaAvaliacao propaga erros que não são 404', async () => {
    jest.mocked(meService.minhaAvaliacao).mockRejectedValue(networkError());

    const { result } = await renderHook(() => useMinhaAvaliacao(2), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('mutations chamam o service e invalidam o cache certo', () => {
  it('useCriarConsulta devolve o id e invalida as consultas', async () => {
    jest.mocked(consultaService.criar).mockResolvedValue(42);
    const request = {
      pacienteId: 5,
      dataHora: '2026-10-01T09:00:00',
      tipo: 'PRESENCIAL' as const,
      convenio: null,
      valor: null,
    };
    const { result } = await renderHook(() => useCriarConsulta(), { wrapper });

    let id: number | undefined;
    await act(async () => {
      id = await result.current.mutateAsync(request);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(id).toBe(42);
    expect(consultaService.criar).toHaveBeenCalledWith(request);
    expect(invalidadas).toContainEqual([...queryKeys.consultas.todas]);
  });

  it.each([
    [
      'useAtualizarConsulta',
      () => useAtualizarConsulta(),
      { id: 8, request: {} },
      consultaService.atualizar,
      [8, {}],
      [queryKeys.consultas.todas],
    ],
    [
      'useDeletarConsulta',
      () => useDeletarConsulta(),
      8,
      consultaService.deletar,
      [8],
      [queryKeys.consultas.todas],
    ],
    [
      'useCriarPaciente',
      () => useCriarPaciente(),
      { nome: 'A', email: 'a@x.com', senha: '12345678' },
      pacienteService.criar,
      [{ nome: 'A', email: 'a@x.com', senha: '12345678' }],
      [queryKeys.pacientes.todos],
    ],
    [
      'useAtualizarPaciente',
      () => useAtualizarPaciente(),
      { id: 3, request: {} },
      pacienteService.atualizar,
      [3, {}],
      [queryKeys.pacientes.todos, queryKeys.consultas.todas],
    ],
    [
      'useDeletarPaciente',
      () => useDeletarPaciente(),
      3,
      pacienteService.deletar,
      [3],
      [queryKeys.pacientes.todos, queryKeys.consultas.todas],
    ],
    [
      'useAtualizarPacienteAdmin',
      () => useAtualizarPacienteAdmin(),
      { id: 3, request: {} },
      pacienteAdminService.atualizar,
      [3, {}],
      [queryKeys.adminPacientes.todos],
    ],
    [
      'useCriarProfissional',
      () => useCriarProfissional(),
      { nome: 'B' },
      profissionalService.criar,
      [{ nome: 'B' }],
      [queryKeys.profissionais.todos],
    ],
    [
      'useAtualizarProfissional',
      () => useAtualizarProfissional(),
      { id: 4, request: {} },
      profissionalService.atualizar,
      [4, {}],
      [queryKeys.profissionais.todos, queryKeys.adminPacientes.todos],
    ],
    [
      'useDeletarProfissional',
      () => useDeletarProfissional(),
      4,
      profissionalService.deletar,
      [4],
      [queryKeys.profissionais.todos, queryKeys.adminPacientes.todos],
    ],
    [
      'useEnviarMensagem',
      () => useEnviarMensagem(),
      { pacienteId: 5, autor: 'PROFISSIONAL', conteudo: 'Oi' },
      mensagemService.enviar,
      [{ pacienteId: 5, autor: 'PROFISSIONAL', conteudo: 'Oi' }],
      [queryKeys.mensagens.todas],
    ],
    [
      'useAtualizarMeuPerfil',
      () => useAtualizarMeuPerfil(),
      { nome: 'A' },
      meService.atualizarPerfil,
      [{ nome: 'A' }],
      [queryKeys.me.perfil()],
    ],
    [
      'useCancelarConsulta',
      () => useCancelarConsulta(),
      2,
      meService.cancelarConsulta,
      [2],
      [queryKeys.me.consultas()],
    ],
    [
      'useEnviarMinhaMensagem',
      () => useEnviarMinhaMensagem(),
      { profissionalId: 4, conteudo: 'Olá' },
      meService.enviarMensagem,
      [4, 'Olá'],
      [queryKeys.me.conversas()],
    ],
    [
      'useAvaliarConsulta',
      () => useAvaliarConsulta(),
      { consultaId: 2, nota: 5, comentario: null },
      meService.avaliar,
      [{ consultaId: 2, nota: 5, comentario: null }],
      [queryKeys.me.avaliacao(2)],
    ],
  ] as const)('%s', async (_nome, hook, valor, service, argumentos, chaves) => {
    jest.mocked(service as jest.Mock).mockResolvedValue(undefined);

    await executar(hook as never, valor);

    expect(service).toHaveBeenCalledWith(...argumentos);
    for (const chave of chaves) {
      expect(invalidadas).toContainEqual([...chave]);
    }
  });

  it('remarcar e marcar atualizam o detalhe e invalidam lista e disponibilidade', async () => {
    const remarcada = consulta({ id: 2, dataHora: '2026-10-02T10:00:00' });
    jest.mocked(meService.remarcarConsulta).mockResolvedValue(remarcada);
    await executar(() => useRemarcarConsulta(), { id: 2, novaDataHora: '2026-10-02T10:00:00' });

    expect(meService.remarcarConsulta).toHaveBeenCalledWith(2, '2026-10-02T10:00:00');
    expect(queryClient.getQueryData(queryKeys.me.consulta(2))).toEqual(remarcada);
    expect(invalidadas).toContainEqual([...queryKeys.me.consultas()]);
    expect(invalidadas).toContainEqual(['me', 'disponibilidade']);

    const marcada = consulta({ id: 9 });
    jest.mocked(meService.marcarConsulta).mockResolvedValue(marcada);
    invalidadas = [];
    await executar(() => useMarcarConsulta(), {
      profissionalId: 4,
      dataHora: '2026-10-01T09:00:00',
      tipo: 'ONLINE',
      convenio: null,
    });

    expect(queryClient.getQueryData(queryKeys.me.consulta(9))).toEqual(marcada);
    expect(invalidadas).toContainEqual([...queryKeys.me.consultas()]);
    expect(invalidadas).toContainEqual(['me', 'disponibilidade']);
    expect(invalidadas).toContainEqual([...queryKeys.me.conversas()]);
  });

  it('invalidar um recurso atualiza listas filtradas e detalhes dele', async () => {
    queryClient.setQueryData(queryKeys.consultas.lista(5), []);
    queryClient.setQueryData(queryKeys.consultas.detalhe(8), {});
    jest.mocked(consultaService.deletar).mockResolvedValue(undefined);

    await executar(() => useDeletarConsulta(), 8);

    expect(queryClient.getQueryState(queryKeys.consultas.lista(5))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(queryKeys.consultas.detalhe(8))).toBeUndefined();
  });

  it('erro na mutation não invalida nada', async () => {
    jest.mocked(consultaService.deletar).mockRejectedValue(httpError(409));
    const { result } = await renderHook(() => useDeletarConsulta(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(8)).rejects.toMatchObject({
        response: { status: 409 },
      });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidadas).toHaveLength(0);
  });
});
