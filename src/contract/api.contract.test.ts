/**
 * Teste de contrato da camada de dados contra o backend REAL (perfil dev).
 *
 * Exercita todos os services com os três perfis (admin, profissional e paciente), usando a
 * mesma sessão JWT e os mesmos interceptors do app. Não roda no `npm test`, só com
 * `npm run test:contract` (veja o README): precisa do backend no ar e das variáveis
 * E2E_API_URL, E2E_ADMIN_EMAIL e E2E_ADMIN_SENHA (lidas de `.maestro/e2e.local`).
 */
import { installAuthInterceptors } from '../api/authInterceptors';
import { api, publicApi } from '../api/client';
import { createSession, type Session } from '../api/session';
import { nuloSeNaoEncontrado } from '../hooks/useAvaliacoes';
import {
  etapaParaRetomar,
  formsDaConsulta,
  montarAtualizacao,
  type Etapa,
} from '../screens/ConsultaWizard/wizardLogic';
import { avaliacaoService } from '../services/avaliacaoService';
import { consultaService } from '../services/consultaService';
import { mensagemService } from '../services/mensagemService';
import { meService } from '../services/meService';
import { pacienteAdminService, pacienteService } from '../services/pacienteService';
import { adminService, profissionalService } from '../services/profissionalService';
import type { TokenStorage } from '../services/tokenStorage';
import type { Consulta } from '../types/consulta';

jest.mock('../api/client', () => {
  const { createApiClient } = jest.requireActual('../api/client');
  const url = (process.env.E2E_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
  // No Node, usa o adapter HTTP do axios (o ambiente do React Native simula o XMLHttpRequest).
  const api = createApiClient(url);
  const publicApi = createApiClient(url);
  api.defaults.adapter = 'http';
  publicApi.defaults.adapter = 'http';
  return { createApiClient, api, publicApi };
});

jest.setTimeout(60_000);

function exigir(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(`Defina ${nome} (veja .maestro/e2e.example).`);
  }
  return valor;
}

function memoria(): TokenStorage {
  let token: string | null = null;
  return {
    getRefreshToken: async () => token,
    setRefreshToken: async (t) => {
      token = t;
    },
    clear: async () => {
      token = null;
    },
  };
}

// Uma sessão por usuário; os interceptors usam sempre a "atual".
let atual: Session;
const sessaoAtual: Session = {
  login: (c) => atual.login(c),
  refresh: () => atual.refresh(),
  logout: () => atual.logout(),
  clearLocal: () => atual.clearLocal(),
  getAccessToken: () => atual.getAccessToken(),
  hasStoredSession: () => atual.hasStoredSession(),
};
const sessaoExpirou = jest.fn();
installAuthInterceptors(api, sessaoAtual, sessaoExpirou);

async function entrarComo(email: string, senha: string): Promise<Session> {
  atual = createSession(publicApi, memoria());
  await atual.login({ email, senha });
  return atual;
}

/** LocalDateTime (sem fuso), como o backend espera. */
function localDateTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}
function localDate(d: Date): string {
  return localDateTime(d).slice(0, 10);
}

const sufixo = Date.now();
const adminEmail = exigir('E2E_ADMIN_EMAIL', process.env.E2E_ADMIN_EMAIL);
const adminSenha = exigir('E2E_ADMIN_SENHA', process.env.E2E_ADMIN_SENHA);
const prof = {
  nome: `Dr. Contrato ${sufixo}`,
  email: `contrato.prof.${sufixo}@fisiotech.test`,
  senha: `senha-${sufixo}`,
};
const paciente1 = {
  nome: 'Paciente Contrato Um',
  email: `contrato.p1.${sufixo}@fisiotech.test`,
  senha: `senha-${sufixo}`,
};
const paciente2 = {
  nome: 'Paciente Contrato Dois',
  email: `contrato.p2.${sufixo}@fisiotech.test`,
  senha: `senha-${sufixo}`,
};

// Estado compartilhado entre os passos (os testes rodam em ordem).
let profId: number;
let paciente1Id: number;
let paciente2Id: number;
let consultaDoProfId: number;
let consultaMarcada: Consulta;

describe('contrato com o backend real', () => {
  describe('admin', () => {
    it('cria, lista, busca e atualiza profissionais', async () => {
      await entrarComo(adminEmail, adminSenha);
      await profissionalService.criar({
        ...prof,
        registroProfissional: `C-${sufixo % 1e9}`,
        especialidade: 'Fisioterapia Contrato',
        valorConsultaParticular: 120,
        conveniosAceitos: ['Unimed'],
        foto: null,
        dataNascimento: '1985-05-20',
        sexo: null,
        telefone: null,
      });

      const lista = await profissionalService.listarTodos();
      const criado = lista.find((p) => p.email === prof.email);
      expect(criado).toBeDefined();
      profId = criado!.id;

      const detalhe = await profissionalService.buscarPorId(profId);
      expect(detalhe).toMatchObject({
        nome: prof.nome,
        especialidade: 'Fisioterapia Contrato',
        valorConsultaParticular: 120,
        conveniosAceitos: ['Unimed'],
        dataNascimento: '1985-05-20',
      });

      await profissionalService.atualizar(profId, {
        ...detalhe,
        senha: null,
        valorConsultaParticular: 150,
      });
      expect((await profissionalService.buscarPorId(profId)).valorConsultaParticular).toBe(150);
    });

    it('cria e exclui um profissional sem vínculos', async () => {
      const email = `contrato.excluir.${sufixo}@fisiotech.test`;
      await profissionalService.criar({
        nome: 'Excluir',
        email,
        senha: `senha-${sufixo}`,
        registroProfissional: `X-${sufixo % 1e9}`,
        especialidade: 'Teste',
        valorConsultaParticular: null,
        conveniosAceitos: [],
        foto: null,
        dataNascimento: null,
        sexo: null,
        telefone: null,
      });
      const id = (await profissionalService.listarTodos()).find((p) => p.email === email)!.id;

      await profissionalService.deletar(id);

      expect((await profissionalService.listarTodos()).some((p) => p.id === id)).toBe(false);
    });
  });

  describe('profissional', () => {
    it('entra e vê os próprios dados em /auth/me', async () => {
      await entrarComo(prof.email, prof.senha);
      const { data } = await api.get('/auth/me');
      expect(data).toMatchObject({ id: profId, email: prof.email, role: 'ROLE_PROFISSIONAL' });
    });

    it('CRUD de pacientes', async () => {
      await pacienteService.criar(paciente1);
      const lista = await pacienteService.listarTodos();
      paciente1Id = lista.find((p) => p.email === paciente1.email)!.id;

      const detalhe = await pacienteService.buscarPorId(paciente1Id);
      expect(detalhe).toMatchObject({ nome: paciente1.nome, profissionalId: profId });

      await pacienteService.atualizar(paciente1Id, {
        nome: paciente1.nome,
        email: paciente1.email,
        senha: null,
        dataNascimento: '1990-01-31',
        sexo: 'F',
        profissao: 'Engenheira',
        telefone: '85999990000',
        endereco: 'Rua A, 1',
        bairro: 'Centro',
        foto: null,
      });
      expect(await pacienteService.buscarPorId(paciente1Id)).toMatchObject({
        dataNascimento: '1990-01-31',
        profissao: 'Engenheira',
        bairro: 'Centro',
      });
    });

    it('consultas: cria (id via Location), lista, filtra, busca e atualiza', async () => {
      const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
      amanha.setHours(15, 0, 0, 0);

      consultaDoProfId = await consultaService.criar({
        pacienteId: paciente1Id,
        dataHora: localDateTime(amanha),
        tipo: 'PRESENCIAL',
        convenio: null,
        valor: 150,
      });
      expect(Number.isInteger(consultaDoProfId)).toBe(true);

      const consulta = await consultaService.buscarPorId(consultaDoProfId);
      expect(consulta).toMatchObject({
        pacienteId: paciente1Id,
        profissionalId: profId,
        dataHora: localDateTime(amanha),
        status: 'AGENDADA',
      });
      // O backend manda LocalDateTime sem fuso, como o app espera.
      expect(consulta.dataHora).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/);

      expect((await consultaService.listarTodos()).some((c) => c.id === consultaDoProfId)).toBe(
        true,
      );
      const doPaciente = await consultaService.listarTodos(paciente1Id);
      expect(doPaciente.every((c) => c.pacienteId === paciente1Id)).toBe(true);

      await consultaService.atualizar(consultaDoProfId, {
        dataHora: consulta.dataHora,
        tipo: consulta.tipo,
        status: 'CONFIRMADA',
        convenio: consulta.convenio,
        valor: consulta.valor,
        quadroClinico: { ...consulta.quadroClinico, queixaPrincipal: 'Dor lombar' },
      });
      expect(await consultaService.buscarPorId(consultaDoProfId)).toMatchObject({
        status: 'CONFIRMADA',
        quadroClinico: { queixaPrincipal: 'Dor lombar' },
      });
    });

    it('registro clínico: salva etapa por etapa sem apagar as anteriores e finaliza', async () => {
      const quando = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      quando.setHours(11, 0, 0, 0);
      const id = await consultaService.criar({
        pacienteId: paciente1Id,
        dataHora: localDateTime(quando),
        tipo: 'ONLINE',
        convenio: 'Unimed',
        valor: 120,
      });
      let c = await consultaService.buscarPorId(id);
      expect(etapaParaRetomar(c)).toBe('quadro-clinico');

      const forms = formsDaConsulta(c);
      forms.quadro.queixaPrincipal = 'Dor lombar';
      forms.quadro.historico = { opcoes: ['Asma'], outrasAtivo: true, outras: 'Fibromialgia' };
      forms.habitos.tabagismo = true;
      forms.exame.postura = 'Hiperlordose';
      forms.diagnostico.planoTratamento = 'Fisioterapia 2x/semana';

      const esperado: Record<Exclude<Etapa, 'sucesso'>, Etapa> = {
        'quadro-clinico': 'habitos-vida',
        'habitos-vida': 'exame-fisico',
        'exame-fisico': 'diagnostico',
        diagnostico: 'sucesso',
      };
      for (const [etapa, retomada] of Object.entries(esperado) as [Etapa, Etapa][]) {
        await consultaService.atualizar(id, montarAtualizacao(c, etapa, forms));
        c = await consultaService.buscarPorId(id);
        // A retomada do wizard enxerga a etapa salva no backend real.
        expect(etapaParaRetomar(c)).toBe(retomada);
      }

      // Os blocos omitidos em cada PUT foram mantidos; a dataHora não mudou (não é remarcação).
      expect(c).toMatchObject({
        status: 'REALIZADA',
        foiRemarcada: false,
        dataHora: localDateTime(quando),
        convenio: 'Unimed',
        quadroClinico: { queixaPrincipal: 'Dor lombar', historicoSaude: 'Asma, Fibromialgia' },
        habitosVida: { tabagismo: true, atividadeFisica: '' },
        exameFisico: { postura: 'Hiperlordose' },
        diagnostico: { planoTratamento: 'Fisioterapia 2x/semana' },
      });
      await consultaService.deletar(id);
    });

    it('mensagens com o paciente e caixa de entrada', async () => {
      await mensagemService.enviar({
        pacienteId: paciente1Id,
        autor: 'PROFISSIONAL',
        conteudo: 'Olá, tudo bem?',
      });
      const conversa = await mensagemService.listarPorPaciente(paciente1Id);
      expect(conversa.at(-1)).toMatchObject({ autor: 'PROFISSIONAL', conteudo: 'Olá, tudo bem?' });

      const caixa = await mensagemService.caixaEntrada();
      expect(caixa.find((i) => i.pacienteId === paciente1Id)).toMatchObject({
        pacienteNome: paciente1.nome,
        ultimaMensagem: 'Olá, tudo bem?',
      });
    });

    it('avaliação inexistente: 404 vira null', async () => {
      await expect(
        nuloSeNaoEncontrado(() => avaliacaoService.buscarPorConsulta(consultaDoProfId)),
      ).resolves.toBeNull();
    });
  });

  describe('paciente (autoatendimento /me)', () => {
    it('cadastro público e perfil', async () => {
      await pacienteService.cadastrarPublico(paciente2);
      await entrarComo(paciente2.email, paciente2.senha);

      const perfil = await meService.perfil();
      expect(perfil).toMatchObject({ nome: paciente2.nome, profissionalId: null });
      paciente2Id = perfil.id;

      await meService.atualizarPerfil({
        nome: paciente2.nome,
        email: paciente2.email,
        dataNascimento: '2000-12-01',
        sexo: null,
        profissao: 'Estudante',
        telefone: null,
        endereco: null,
        bairro: null,
        foto: null,
      });
      expect(await meService.perfil()).toMatchObject({ profissao: 'Estudante' });
    });

    it('busca profissionais e disponibilidade', async () => {
      const todos = await meService.buscarProfissionais();
      expect(todos.some((p) => p.id === profId)).toBe(true);

      const porNome = await meService.buscarProfissionais(prof.nome);
      expect(porNome.map((p) => p.id)).toContain(profId);
      const porEspecialidade = await meService.buscarProfissionais('', 'Fisioterapia Contrato');
      expect(porEspecialidade.map((p) => p.id)).toContain(profId);

      expect(await meService.buscarProfissional(profId)).toMatchObject({
        id: profId,
        valorConsultaParticular: 150,
        conveniosAceitos: ['Unimed'],
      });
    });

    it('marca, remarca e cancela consulta', async () => {
      // Procura dois horários livres nos próximos dias.
      const livres: string[] = [];
      for (let dia = 1; dia <= 10 && livres.length < 2; dia++) {
        const data = localDate(new Date(Date.now() + dia * 24 * 60 * 60 * 1000));
        const disponibilidade = await meService.buscarDisponibilidade(profId, data);
        expect(disponibilidade.data).toBe(data);
        for (const slot of disponibilidade.horarios) {
          expect(slot.horario).toMatch(/^\d{2}:\d{2}/);
          if (slot.disponivel && livres.length < 2) {
            livres.push(`${data}T${slot.horario.slice(0, 5)}:00`);
          }
        }
      }
      expect(livres).toHaveLength(2);

      consultaMarcada = await meService.marcarConsulta({
        profissionalId: profId,
        dataHora: livres[0],
        tipo: 'ONLINE',
        convenio: 'Unimed',
      });
      expect(consultaMarcada).toMatchObject({
        profissionalId: profId,
        pacienteId: paciente2Id,
        dataHora: livres[0],
        tipo: 'ONLINE',
        convenio: 'Unimed',
      });

      expect((await meService.minhasConsultas()).map((c) => c.id)).toContain(consultaMarcada.id);
      expect(await meService.minhaConsulta(consultaMarcada.id)).toMatchObject({
        dataHora: livres[0],
      });
      // Marcar a primeira consulta vincula o profissional ao paciente.
      expect(await meService.perfil()).toMatchObject({ profissionalId: profId });

      const remarcada = await meService.remarcarConsulta(consultaMarcada.id, livres[1]);
      expect(remarcada).toMatchObject({ id: consultaMarcada.id, dataHora: livres[1] });

      await meService.cancelarConsulta(consultaMarcada.id);
      expect(await meService.minhaConsulta(consultaMarcada.id)).toMatchObject({
        status: 'CANCELADA',
      });
    });

    it('mensagens com o profissional', async () => {
      await meService.enviarMensagem(profId, 'Oi, doutor!');
      const conversa = await meService.minhaConversa(profId);
      expect(conversa.at(-1)).toMatchObject({ autor: 'PACIENTE', conteudo: 'Oi, doutor!' });

      const conversas = await meService.minhasConversas();
      expect(conversas.find((c) => c.profissionalId === profId)).toMatchObject({
        profissionalNome: prof.nome,
        ultimaMensagem: 'Oi, doutor!',
        ultimoAutor: 'PACIENTE',
      });
    });

    it('avalia uma consulta realizada', async () => {
      // O profissional marca uma nova consulta do paciente como realizada.
      await entrarComo(prof.email, prof.senha);
      const quando = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      quando.setHours(16, 0, 0, 0);
      const id = await consultaService.criar({
        pacienteId: paciente2Id,
        dataHora: localDateTime(quando),
        tipo: 'PRESENCIAL',
        convenio: null,
        valor: 150,
      });
      const c = await consultaService.buscarPorId(id);
      await consultaService.atualizar(id, {
        dataHora: c.dataHora,
        tipo: c.tipo,
        status: 'REALIZADA',
        convenio: c.convenio,
        valor: c.valor,
      });

      await entrarComo(paciente2.email, paciente2.senha);
      await expect(nuloSeNaoEncontrado(() => meService.minhaAvaliacao(id))).resolves.toBeNull();
      await meService.avaliar({ consultaId: id, nota: 5, comentario: 'Ótimo atendimento' });
      expect(await meService.minhaAvaliacao(id)).toMatchObject({ consultaId: id, nota: 5 });

      await entrarComo(prof.email, prof.senha);
      expect(await avaliacaoService.buscarPorConsulta(id)).toMatchObject({
        nota: 5,
        comentario: 'Ótimo atendimento',
      });
    });
  });

  describe('admin: pacientes', () => {
    it('lista, busca e atualiza pacientes (inclusive o profissional responsável)', async () => {
      await entrarComo(adminEmail, adminSenha);
      const lista = await pacienteAdminService.listarTodos();
      expect(lista.map((p) => p.id)).toEqual(expect.arrayContaining([paciente1Id, paciente2Id]));

      const p2 = await pacienteAdminService.buscarPorId(paciente2Id);
      await pacienteAdminService.atualizar(paciente2Id, {
        nome: `${p2.nome} (editado)`,
        email: p2.email,
        senha: null,
        profissionalId: profId,
      });
      expect(await pacienteAdminService.buscarPorId(paciente2Id)).toMatchObject({
        nome: `${paciente2.nome} (editado)`,
        profissionalId: profId,
        profissionalNome: prof.nome,
      });
    });
  });

  describe('troca de senha (as três variantes) e limpeza', () => {
    it('profissional troca a própria senha; a sessão antiga é revogada', async () => {
      const antiga = await entrarComo(prof.email, prof.senha);
      const novaSenha = `${prof.senha}-nova`;

      await profissionalService.alterarPropriaSenha({ senhaAtual: prof.senha, novaSenha });

      // O backend revoga todas as sessões: renovar a antiga falha com "sessão expirada".
      await expect(antiga.refresh()).rejects.toThrow(/Sessão expirada/);
      await entrarComo(prof.email, novaSenha);
      prof.senha = novaSenha;
    });

    it('senha atual incorreta responde 400', async () => {
      await expect(
        profissionalService.alterarPropriaSenha({
          senhaAtual: 'errada-123',
          novaSenha: 'x-12345678',
        }),
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    it('paciente troca a própria senha', async () => {
      await entrarComo(paciente2.email, paciente2.senha);
      const novaSenha = `${paciente2.senha}-nova`;
      await meService.alterarSenha({ senhaAtual: paciente2.senha, novaSenha });
      await entrarComo(paciente2.email, novaSenha);
    });

    it('admin troca a própria senha e volta à original', async () => {
      await entrarComo(adminEmail, adminSenha);
      const temporaria = `${adminSenha}-tmp`;
      await adminService.alterarPropriaSenha({ senhaAtual: adminSenha, novaSenha: temporaria });
      await entrarComo(adminEmail, temporaria);
      await adminService.alterarPropriaSenha({ senhaAtual: temporaria, novaSenha: adminSenha });
      await entrarComo(adminEmail, adminSenha);
    });

    it('profissional exclui consulta; paciente só sem registros associados', async () => {
      await entrarComo(prof.email, prof.senha);
      await consultaService.deletar(consultaDoProfId);
      await expect(consultaService.buscarPorId(consultaDoProfId)).rejects.toMatchObject({
        response: { status: 404 },
      });

      // Paciente com mensagens: o backend recusa a exclusão com 409 (registros associados).
      await expect(pacienteService.deletar(paciente1Id)).rejects.toMatchObject({
        response: { status: 409 },
      });

      // Paciente sem nenhum vínculo: exclui normalmente.
      const email = `contrato.p3.${sufixo}@fisiotech.test`;
      await pacienteService.criar({ nome: 'Sem Vínculos', email, senha: `senha-${sufixo}` });
      const id = (await pacienteService.listarTodos()).find((p) => p.email === email)!.id;
      await pacienteService.deletar(id);
      expect((await pacienteService.listarTodos()).some((p) => p.id === id)).toBe(false);
    });

    it('nenhuma chamada autenticada derrubou a sessão por engano', () => {
      expect(sessaoExpirou).not.toHaveBeenCalled();
    });
  });
});
