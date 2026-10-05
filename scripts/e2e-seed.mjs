#!/usr/bin/env node
/**
 * Prepara dados para os testes e2e (Maestro) num backend FisioTech de DESENVOLVIMENTO:
 * cria um profissional, dois pacientes dele e consultas para hoje.
 *
 * Nada de credencial fica no repositório. Tudo vem de variáveis de ambiente:
 *   E2E_API_URL        URL do backend visto do PC (padrão: http://localhost:8080)
 *   E2E_ADMIN_EMAIL    admin do backend (no perfil dev do backend, veja o README de lá)
 *   E2E_ADMIN_SENHA
 *   E2E_PROF_EMAIL     profissional a ser criado para o teste
 *   E2E_PROF_SENHA     (mínimo 8 caracteres)
 *   E2E_PROF_NOME      (padrão: "Dra. Teste E2E")
 *
 * Uso: node scripts/e2e-seed.mjs
 */

const api = (process.env.E2E_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

function exigir(nome) {
  // Este script roda no Node; as variáveis não são embutidas pelo Metro.
  // eslint-disable-next-line expo/no-dynamic-env-var
  const valor = process.env[nome];
  if (!valor) {
    console.error(`Defina a variável de ambiente ${nome}.`);
    process.exit(1);
  }
  return valor;
}

class HttpError extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

async function chamar(metodo, caminho, { token, body } = {}) {
  const resposta = await fetch(`${api}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new HttpError(resposta.status, `${metodo} ${caminho} → ${resposta.status}: ${texto}`);
  }
  const conteudo = await resposta.text();
  return { data: conteudo ? JSON.parse(conteudo) : null, headers: resposta.headers };
}

async function login(email, senha) {
  const { data } = await chamar('POST', '/auth/login', { body: { email, senha } });
  return data.accessToken;
}

/** LocalDateTime (sem fuso), no formato que o backend espera. */
function localDateTime(data) {
  const p = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}T${p(data.getHours())}:${p(data.getMinutes())}:00`;
}

const adminToken = await login(exigir('E2E_ADMIN_EMAIL'), exigir('E2E_ADMIN_SENHA'));

const prof = {
  nome: process.env.E2E_PROF_NOME ?? 'Dra. Teste E2E',
  email: exigir('E2E_PROF_EMAIL'),
  senha: exigir('E2E_PROF_SENHA'),
};

// Se o profissional já existir (execução anterior), reaproveita.
await chamar('POST', '/profissionais', {
  token: adminToken,
  body: {
    ...prof,
    // Único por execução (o backend não aceita registro repetido; máx. 20 caracteres).
    registroProfissional: `E2E-${Date.now() % 1e9}`,
    especialidade: 'Fisioterapia Ortopédica',
    valorConsultaParticular: 150,
    conveniosAceitos: ['Unimed'],
    foto: null,
    dataNascimento: null,
    sexo: null,
    telefone: null,
  },
}).catch((erro) => {
  if (erro.status !== 409) {
    throw erro;
  }
});

const profToken = await login(prof.email, prof.senha);
const sufixo = Date.now();
const nomes = ['Maria Paciente E2E', 'João Paciente E2E'];

for (const [i, nome] of nomes.entries()) {
  await chamar('POST', '/pacientes', {
    token: profToken,
    body: {
      nome,
      email:
        i === 0 && process.env.E2E_CHAT_PACIENTE_EMAIL
          ? process.env.E2E_CHAT_PACIENTE_EMAIL
          : `paciente${i}.${sufixo}@fisiotech.test`,
      senha:
        i === 0 && process.env.E2E_CHAT_PACIENTE_SENHA
          ? process.env.E2E_CHAT_PACIENTE_SENHA
          : `senha-${sufixo}`,
    },
  });
}

const { data: pacientes } = await chamar('GET', '/pacientes', { token: profToken });
const porNome = Object.fromEntries(pacientes.map((p) => [p.nome, p.id]));

// Consultas de hoje no futuro próximo: a primeira vira o destaque, a segunda vai para a agenda.
const agora = new Date();
const daquiA = (minutos) => {
  const d = new Date(agora.getTime() + minutos * 60_000);
  d.setSeconds(0, 0);
  return d;
};
const consultas = [
  { paciente: nomes[0], quando: daquiA(60), tipo: 'ONLINE', convenio: 'Unimed' },
  { paciente: nomes[1], quando: daquiA(120), tipo: 'PRESENCIAL', convenio: null },
];
for (const c of consultas) {
  await chamar('POST', '/consultas', {
    token: profToken,
    body: {
      pacienteId: porNome[c.paciente],
      dataHora: localDateTime(c.quando),
      tipo: c.tipo,
      convenio: c.convenio,
      valor: c.convenio ? null : 150,
    },
  });
}

console.log(
  JSON.stringify(
    {
      profissional: prof.nome,
      pacientes: nomes,
      consultas: consultas.map((c) => `${localDateTime(c.quando)} ${c.paciente}`),
    },
    null,
    2,
  ),
);
