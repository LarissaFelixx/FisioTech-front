import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AxiosError,
  AxiosHeaders,
  create,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ReactNode } from 'react';

import type { TokenStorage } from '../services/tokenStorage';
import type { Consulta } from '../types/consulta';

/** Erro HTTP do axios com o status informado. */
export function httpError(status: number, config?: InternalAxiosRequestConfig): AxiosError {
  const cfg = config ?? ({ headers: new AxiosHeaders() } as InternalAxiosRequestConfig);
  const response = {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: cfg,
  } as AxiosResponse;
  return new AxiosError(`HTTP ${status}`, 'ERR_BAD_RESPONSE', cfg, {}, response);
}

export function networkError(): AxiosError {
  return new AxiosError('Network Error', 'ERR_NETWORK', undefined, {});
}

type Handler = (
  config: InternalAxiosRequestConfig,
) => { status: number; data?: unknown } | Promise<{ status: number; data?: unknown }>;

/** Cliente axios com um adapter falso: nenhuma chamada sai para a rede. */
export function fakeClient(
  handler: Handler,
): AxiosInstance & { calls: InternalAxiosRequestConfig[] } {
  const calls: InternalAxiosRequestConfig[] = [];
  const client = create({
    baseURL: 'http://api.test',
    adapter: async (config) => {
      // Cópia: o axios reaproveita o mesmo config quando a requisição é repetida.
      calls.push({ ...config, headers: new AxiosHeaders(config.headers) });
      const { status, data } = await handler(config);
      if (status >= 400) {
        throw httpError(status, config);
      }
      return { status, data, statusText: '', headers: {}, config } as AxiosResponse;
    },
  });
  return Object.assign(client, { calls });
}

/** Armazenamento de tokens em memória. */
export function memoryStorage(
  inicial: string | null = null,
): TokenStorage & { value: string | null } {
  const storage: TokenStorage & { value: string | null } = {
    value: inicial,
    getRefreshToken: jest.fn(async (): Promise<string | null> => storage.value),
    setRefreshToken: jest.fn(async (token: string) => {
      storage.value = token;
    }),
    clear: jest.fn(async () => {
      storage.value = null;
    }),
  };
  return storage;
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    // gcTime infinito: sem timers de coleta pendentes que impeçam o Jest de encerrar.
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
}

export function Providers({
  children,
  queryClient = createTestQueryClient(),
  navigation = false,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
  navigation?: boolean;
}) {
  const content = navigation ? <NavigationContainer>{children}</NavigationContainer> : children;
  return <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>;
}

let proximoId = 1;

/** Consulta com valores padrão; `dataHora` no formato do backend (LocalDateTime sem fuso). */
export function consulta(parcial: Partial<Consulta> = {}): Consulta {
  const id = parcial.id ?? proximoId++;
  return {
    id,
    pacienteId: 10,
    pacienteNome: 'Maria Souza',
    profissionalId: 1,
    profissionalNome: 'Dra. Ana',
    dataHora: '2026-09-29T15:00:00',
    tipo: 'PRESENCIAL',
    status: 'AGENDADA',
    foiRemarcada: false,
    convenio: null,
    valor: null,
    quadroClinico: {
      queixaPrincipal: null,
      historiaDoencaAtual: null,
      historicoSaude: null,
      cirurgias: null,
      cirurgiasDescricao: null,
      lesoesAnteriores: null,
      lesoesAnterioresDescricao: null,
      medicamentos: null,
    },
    habitosVida: {
      atividadeFisica: null,
      rotinaTrabalho: null,
      tabagismo: null,
      consumoAlcool: null,
    },
    exameFisico: { postura: null, amplitudeMovimento: null, palpacao: null, forcaMuscular: null },
    diagnostico: { planoTratamento: null, objetivosTratamento: null },
    dataCriacao: '2026-09-01T10:00:00',
    ...parcial,
  };
}
