import type { InternalAxiosRequestConfig } from 'axios';

import { idDoLocation } from '../api/location';
import { avaliacaoService } from './avaliacaoService';
import { consultaService } from './consultaService';
import { mensagemService } from './mensagemService';
import { meService } from './meService';
import { pacienteAdminService, pacienteService } from './pacienteService';
import { adminService, profissionalService } from './profissionalService';

// Todas as chamadas passam por clientes falsos que registram a requisição e respondem `mockResposta`.
let mockResposta: { status: number; data?: unknown; headers?: Record<string, string> };
const mockChamadas: { cliente: string; config: InternalAxiosRequestConfig }[] = [];

jest.mock('../api/client', () => {
  const { create } = jest.requireActual('axios');
  const criar = (cliente: string) =>
    create({
      baseURL: 'http://api.test',
      adapter: async (config: InternalAxiosRequestConfig) => {
        mockChamadas.push({ cliente, config });
        return { statusText: '', headers: {}, config, ...mockResposta };
      },
    });
  return { api: criar('api'), publicApi: criar('publicApi') };
});

beforeEach(() => {
  mockChamadas.length = 0;
  mockResposta = { status: 200, data: { ok: true } };
});

function ultimaChamada() {
  const { cliente, config } = mockChamadas[mockChamadas.length - 1];
  return {
    cliente,
    metodo: config.method?.toUpperCase(),
    url: config.url,
    params: config.params,
    corpo: config.data ? JSON.parse(config.data) : undefined,
  };
}

type Caso = [
  descricao: string,
  chamar: () => Promise<unknown>,
  esperado: { metodo: string; url: string; params?: unknown; corpo?: unknown; cliente?: string },
];

const senha = { senhaAtual: 'atual-123', novaSenha: 'nova-1234' };
const pacienteCreate = { nome: 'Ana', email: 'ana@x.com', senha: '12345678' };
const pacienteUpdate = {
  nome: 'Ana',
  email: 'ana@x.com',
  senha: null,
  dataNascimento: '1990-01-31',
  sexo: null,
  profissao: null,
  telefone: null,
  endereco: null,
  bairro: null,
  foto: null,
};
const profissionalReq = {
  nome: 'Dra. Bia',
  email: 'bia@x.com',
  senha: '12345678',
  registroProfissional: 'CREFITO-1',
  especialidade: 'Ortopedia',
  valorConsultaParticular: 150,
  conveniosAceitos: ['Unimed'],
  foto: null,
  dataNascimento: null,
  sexo: null,
  telefone: null,
};
const consultaUpdate = {
  dataHora: '2026-10-01T09:00:00',
  tipo: 'PRESENCIAL' as const,
  status: 'CONFIRMADA' as const,
  convenio: null,
  valor: 150,
};

const casos: Caso[] = [
  // pacienteService
  [
    'paciente.listarTodos',
    () => pacienteService.listarTodos(),
    { metodo: 'GET', url: '/pacientes' },
  ],
  [
    'paciente.buscarPorId',
    () => pacienteService.buscarPorId(7),
    { metodo: 'GET', url: '/pacientes/7' },
  ],
  [
    'paciente.criar',
    () => pacienteService.criar(pacienteCreate),
    { metodo: 'POST', url: '/pacientes', corpo: pacienteCreate },
  ],
  [
    'paciente.cadastrarPublico (sem Bearer)',
    () => pacienteService.cadastrarPublico(pacienteCreate),
    { metodo: 'POST', url: '/pacientes/cadastro', corpo: pacienteCreate, cliente: 'publicApi' },
  ],
  [
    'paciente.atualizar',
    () => pacienteService.atualizar(7, pacienteUpdate),
    { metodo: 'PUT', url: '/pacientes/7', corpo: pacienteUpdate },
  ],
  ['paciente.deletar', () => pacienteService.deletar(7), { metodo: 'DELETE', url: '/pacientes/7' }],
  // pacienteAdminService
  [
    'pacienteAdmin.listarTodos',
    () => pacienteAdminService.listarTodos(),
    { metodo: 'GET', url: '/admin/pacientes' },
  ],
  [
    'pacienteAdmin.buscarPorId',
    () => pacienteAdminService.buscarPorId(3),
    { metodo: 'GET', url: '/admin/pacientes/3' },
  ],
  [
    'pacienteAdmin.atualizar',
    () =>
      pacienteAdminService.atualizar(3, {
        nome: 'A',
        email: 'a@x.com',
        senha: null,
        profissionalId: 9,
      }),
    {
      metodo: 'PUT',
      url: '/admin/pacientes/3',
      corpo: { nome: 'A', email: 'a@x.com', senha: null, profissionalId: 9 },
    },
  ],
  // profissionalService / adminService
  [
    'profissional.listarTodos',
    () => profissionalService.listarTodos(),
    { metodo: 'GET', url: '/profissionais' },
  ],
  [
    'profissional.buscarPorId',
    () => profissionalService.buscarPorId(4),
    { metodo: 'GET', url: '/profissionais/4' },
  ],
  [
    'profissional.criar',
    () => profissionalService.criar(profissionalReq),
    { metodo: 'POST', url: '/profissionais', corpo: profissionalReq },
  ],
  [
    'profissional.atualizar',
    () => profissionalService.atualizar(4, profissionalReq),
    { metodo: 'PUT', url: '/profissionais/4', corpo: profissionalReq },
  ],
  [
    'profissional.deletar',
    () => profissionalService.deletar(4),
    { metodo: 'DELETE', url: '/profissionais/4' },
  ],
  [
    'profissional.alterarPropriaSenha',
    () => profissionalService.alterarPropriaSenha(senha),
    { metodo: 'PUT', url: '/profissionais/me/senha', corpo: senha },
  ],
  [
    'admin.alterarPropriaSenha',
    () => adminService.alterarPropriaSenha(senha),
    { metodo: 'PUT', url: '/admin/me/senha', corpo: senha },
  ],
  // consultaService
  [
    'consulta.listarTodos',
    () => consultaService.listarTodos(),
    { metodo: 'GET', url: '/consultas', params: undefined },
  ],
  [
    'consulta.listarTodos por paciente',
    () => consultaService.listarTodos(5),
    { metodo: 'GET', url: '/consultas', params: { pacienteId: 5 } },
  ],
  [
    'consulta.buscarPorId',
    () => consultaService.buscarPorId(8),
    { metodo: 'GET', url: '/consultas/8' },
  ],
  [
    'consulta.atualizar',
    () => consultaService.atualizar(8, consultaUpdate),
    { metodo: 'PUT', url: '/consultas/8', corpo: consultaUpdate },
  ],
  ['consulta.deletar', () => consultaService.deletar(8), { metodo: 'DELETE', url: '/consultas/8' }],
  // mensagemService
  [
    'mensagem.listarPorPaciente',
    () => mensagemService.listarPorPaciente(5),
    { metodo: 'GET', url: '/mensagens', params: { pacienteId: 5 } },
  ],
  [
    'mensagem.enviar',
    () => mensagemService.enviar({ pacienteId: 5, autor: 'PROFISSIONAL', conteudo: 'Oi' }),
    {
      metodo: 'POST',
      url: '/mensagens',
      corpo: { pacienteId: 5, autor: 'PROFISSIONAL', conteudo: 'Oi' },
    },
  ],
  [
    'mensagem.caixaEntrada',
    () => mensagemService.caixaEntrada(),
    { metodo: 'GET', url: '/mensagens/caixa-entrada' },
  ],
  // avaliacaoService
  [
    'avaliacao.buscarPorConsulta',
    () => avaliacaoService.buscarPorConsulta(8),
    { metodo: 'GET', url: '/avaliacoes/consulta/8' },
  ],
  [
    'avaliacao.criar',
    () => avaliacaoService.criar({ consultaId: 8, nota: 5, comentario: null }),
    { metodo: 'POST', url: '/avaliacoes', corpo: { consultaId: 8, nota: 5, comentario: null } },
  ],
  // meService
  ['me.perfil', () => meService.perfil(), { metodo: 'GET', url: '/me' }],
  [
    'me.atualizarPerfil',
    () => meService.atualizarPerfil({ ...pacienteUpdate, senha: undefined } as never),
    { metodo: 'PUT', url: '/me' },
  ],
  [
    'me.alterarSenha',
    () => meService.alterarSenha(senha),
    { metodo: 'PUT', url: '/me/senha', corpo: senha },
  ],
  [
    'me.minhasConsultas',
    () => meService.minhasConsultas(),
    { metodo: 'GET', url: '/me/consultas' },
  ],
  ['me.minhaConsulta', () => meService.minhaConsulta(2), { metodo: 'GET', url: '/me/consultas/2' }],
  [
    'me.cancelarConsulta',
    () => meService.cancelarConsulta(2),
    { metodo: 'PUT', url: '/me/consultas/2/cancelar', corpo: {} },
  ],
  [
    'me.remarcarConsulta',
    () => meService.remarcarConsulta(2, '2026-10-02T10:00:00'),
    {
      metodo: 'PUT',
      url: '/me/consultas/2/remarcar',
      corpo: { novaDataHora: '2026-10-02T10:00:00' },
    },
  ],
  [
    'me.minhasConversas',
    () => meService.minhasConversas(),
    { metodo: 'GET', url: '/me/mensagens/caixa-entrada' },
  ],
  ['me.minhaConversa', () => meService.minhaConversa(4), { metodo: 'GET', url: '/me/mensagens/4' }],
  [
    'me.enviarMensagem',
    () => meService.enviarMensagem(4, 'Olá'),
    { metodo: 'POST', url: '/me/mensagens/4', corpo: { conteudo: 'Olá' } },
  ],
  [
    'me.avaliar',
    () => meService.avaliar({ consultaId: 2, nota: 4, comentario: 'Boa' }),
    { metodo: 'POST', url: '/me/avaliacoes', corpo: { consultaId: 2, nota: 4, comentario: 'Boa' } },
  ],
  [
    'me.minhaAvaliacao',
    () => meService.minhaAvaliacao(2),
    { metodo: 'GET', url: '/me/avaliacoes/consulta/2' },
  ],
  [
    'me.buscarProfissionais sem filtros',
    () => meService.buscarProfissionais(),
    { metodo: 'GET', url: '/me/profissionais', params: {} },
  ],
  [
    'me.buscarProfissionais omite filtros vazios',
    () => meService.buscarProfissionais('', 'Ortopedia'),
    { metodo: 'GET', url: '/me/profissionais', params: { especialidade: 'Ortopedia' } },
  ],
  [
    'me.buscarProfissionais com os dois filtros',
    () => meService.buscarProfissionais('Bia', 'Ortopedia'),
    {
      metodo: 'GET',
      url: '/me/profissionais',
      params: { nome: 'Bia', especialidade: 'Ortopedia' },
    },
  ],
  [
    'me.buscarProfissional',
    () => meService.buscarProfissional(4),
    { metodo: 'GET', url: '/me/profissionais/4' },
  ],
  [
    'me.buscarDisponibilidade',
    () => meService.buscarDisponibilidade(4, '2026-10-01'),
    { metodo: 'GET', url: '/me/profissionais/4/disponibilidade', params: { data: '2026-10-01' } },
  ],
  [
    'me.marcarConsulta',
    () =>
      meService.marcarConsulta({
        profissionalId: 4,
        dataHora: '2026-10-01T09:00:00',
        tipo: 'ONLINE',
        convenio: 'Unimed',
      }),
    {
      metodo: 'POST',
      url: '/me/consultas',
      corpo: {
        profissionalId: 4,
        dataHora: '2026-10-01T09:00:00',
        tipo: 'ONLINE',
        convenio: 'Unimed',
      },
    },
  ],
];

describe.each(casos)('%s', (_descricao, chamar, esperado) => {
  it('chama o endpoint certo', async () => {
    await chamar();
    const chamada = ultimaChamada();

    expect(chamada.metodo).toBe(esperado.metodo);
    expect(chamada.url).toBe(esperado.url);
    expect(chamada.cliente).toBe(esperado.cliente ?? 'api');
    if ('params' in esperado) {
      expect(chamada.params).toEqual(esperado.params);
    }
    if ('corpo' in esperado) {
      expect(chamada.corpo).toEqual(esperado.corpo);
    }
  });
});

describe('retornos', () => {
  it('métodos de leitura devolvem o corpo da mockResposta', async () => {
    mockResposta = { status: 200, data: [{ id: 1 }] };
    await expect(pacienteService.listarTodos()).resolves.toEqual([{ id: 1 }]);
    mockResposta = { status: 200, data: { data: '2026-10-01', horarios: [] } };
    await expect(meService.buscarDisponibilidade(1, '2026-10-01')).resolves.toEqual({
      data: '2026-10-01',
      horarios: [],
    });
  });

  it('consulta.criar devolve o id lido do header Location', async () => {
    mockResposta = { status: 201, headers: { location: 'http://10.0.2.2:8080/consultas/42' } };

    await expect(
      consultaService.criar({
        pacienteId: 5,
        dataHora: '2026-10-01T09:00:00',
        tipo: 'PRESENCIAL',
        convenio: null,
        valor: 150,
      }),
    ).resolves.toBe(42);
    expect(ultimaChamada()).toMatchObject({ metodo: 'POST', url: '/consultas' });
  });

  it('consulta.criar falha com mensagem clara se o Location não vier', async () => {
    mockResposta = { status: 201, headers: {} };
    await expect(
      consultaService.criar({
        pacienteId: 5,
        dataHora: '2026-10-01T09:00:00',
        tipo: 'PRESENCIAL',
        convenio: null,
        valor: null,
      }),
    ).rejects.toThrow(/Location/);
  });
});

describe('idDoLocation', () => {
  it('lê o último segmento numérico da URL', () => {
    expect(idDoLocation('/consultas/7')).toBe(7);
    expect(idDoLocation('http://host:8080/consultas/123')).toBe(123);
  });

  it.each([undefined, null, '', '/consultas/', '/consultas/abc', '/consultas/0'])(
    'rejeita %p',
    (valor) => {
      expect(() => idDoLocation(valor)).toThrow(/Location/);
    },
  );
});
