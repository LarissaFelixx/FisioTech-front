#!/usr/bin/env node
/**
 * Gera um APK de release instalável (assinado com a chave de debug, para testes) por build local.
 *
 *   EXPO_PUBLIC_API_URL=http://192.168.0.10:8080 npm run build:apk
 *
 * A URL da API fica embutida no APK: use o IP do computador que roda o backend na rede Wi-Fi
 * (funciona no celular e no emulador). Sem a variável, vale o `.env`.
 * Requisitos: JDK 17+ e Android SDK (ANDROID_HOME). Saída: `build/fisiotech-<versão>.apk`.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const env = { ...process.env };
env.ANDROID_HOME ??= join(homedir(), 'Android', 'Sdk');

function rodar(comando, args, opcoes = {}) {
  const r = spawnSync(comando, args, { stdio: 'inherit', env, ...opcoes });
  if (r.status !== 0) {
    console.error(`\nFalhou: ${comando} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

if (!env.EXPO_PUBLIC_API_URL && !existsSync('.env')) {
  console.error('Defina EXPO_PUBLIC_API_URL (ou crie o .env a partir do .env.example).');
  process.exit(1);
}
console.log(`API embutida no APK: ${env.EXPO_PUBLIC_API_URL ?? '(valor do .env)'}`);

// Gera a pasta android/ a partir do app.json (ignorada pelo git) e compila. O prebuild reescreve
// os scripts "android"/"ios" do package.json; o original é restaurado logo em seguida.
const packageJson = readFileSync('package.json', 'utf8');
rodar('npx', ['expo', 'prebuild', '--platform', 'android', '--clean']);
writeFileSync('package.json', packageJson);
rodar('./gradlew', ['assembleRelease'], { cwd: 'android' });

const versao = JSON.parse(readFileSync('app.json', 'utf8')).expo.version;
const origem = 'android/app/build/outputs/apk/release/app-release.apk';
mkdirSync('build', { recursive: true });
const destino = `build/fisiotech-${versao}.apk`;
copyFileSync(origem, destino);
console.log(`\nAPK gerado: ${destino}`);
