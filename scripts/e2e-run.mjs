#!/usr/bin/env node
/**
 * Roda os testes e2e (Maestro). Pré-requisitos: emulador aberto e Metro rodando (`npm start`).
 *
 * - Sempre roda o smoke test (`.maestro/smoke.yaml`).
 * - Se existir `.maestro/e2e.local` (modelo em `.maestro/e2e.example`), também cria os dados de teste no
 *   backend (scripts/e2e-seed.mjs) e roda os fluxos marcados com a tag `backend`.
 *
 * - Com `--apk`, roda os fluxos de `.maestro/apk/` no APK instalado (`com.fisiotech.app`)
 *   em vez dos fluxos do Expo Go.
 *
 * Os demais argumentos são repassados ao `maestro test`.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const ENV_FILE = '.maestro/e2e.local';

function lerEnv(arquivo) {
  const env = {};
  for (const linha of readFileSync(arquivo, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linha);
    if (m) {
      env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
    }
  }
  return env;
}

function rodar(comando, args, env = {}) {
  const r = spawnSync(comando, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.error) {
    console.error(`Falha ao executar ${comando}: ${r.error.message}`);
    process.exit(1);
  }
  return r.status ?? 1;
}

const apk = process.argv.includes('--apk');
const extras = process.argv.slice(2).filter((arg) => arg !== '--apk');
const base = ['test', '--test-output-dir', '.maestro/reports'];
const comBackend = existsSync(ENV_FILE);

if (apk && !comBackend) {
  console.error(`Os fluxos do APK precisam do backend: crie ${ENV_FILE}.`);
  process.exit(1);
}
if (!comBackend) {
  console.log(`(${ENV_FILE} não encontrado: rodando só o smoke test, sem backend)`);
  process.exit(rodar('maestro', [...base, ...extras, '.maestro/smoke.yaml']));
}

const env = lerEnv(ENV_FILE);
// Um profissional novo a cada execução, para os dados do seed não se acumularem.
env.E2E_PROF_EMAIL ||= `e2e.prof.${Date.now()}@fisiotech.test`;
if (rodar('node', ['scripts/e2e-seed.mjs'], env) !== 0) {
  process.exit(1);
}
process.exit(
  rodar('maestro', [
    ...base,
    '-e',
    `PROF_EMAIL=${env.E2E_PROF_EMAIL}`,
    '-e',
    `PROF_SENHA=${env.E2E_PROF_SENHA}`,
    '-e',
    `PROF_NOME=${env.E2E_PROF_NOME ?? 'Dra. Teste E2E'}`,
    ...extras,
    ...(apk
      ? ['.maestro/apk/profissional-apk.yaml']
      : [
          '.maestro/smoke.yaml',
          '.maestro/auth-profissional.yaml',
          '.maestro/cadastro-paciente.yaml',
          '.maestro/profissional-pacientes.yaml',
        ]),
  ]),
);
