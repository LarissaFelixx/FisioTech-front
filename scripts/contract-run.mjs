#!/usr/bin/env node
/**
 * Roda os testes de contrato (src/contract) contra o backend real, lendo as credenciais de
 * teste de `.maestro/e2e.local` (mesmo arquivo do e2e; modelo em `.maestro/e2e.example`).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const ENV_FILE = '.maestro/e2e.local';
if (!existsSync(ENV_FILE)) {
  console.error(`Crie ${ENV_FILE} a partir de .maestro/e2e.example (backend de dev).`);
  process.exit(1);
}

const env = { ...process.env };
for (const linha of readFileSync(ENV_FILE, 'utf8').split('\n')) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linha);
  if (m) {
    env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
}

const r = spawnSync(
  'npx',
  ['jest', '--config', 'jest.contract.config.js', '--runInBand', ...process.argv.slice(2)],
  { stdio: 'inherit', env },
);
process.exit(r.status ?? 1);
