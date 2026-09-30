# FisioTech — App mobile (React Native / Expo)

App Android do sistema de gestão de clínica de fisioterapia **FisioTech**. Este repositório é a
migração do front Angular + Capacitor para **React Native com Expo**. O app consome a mesma API
do backend Java 21 / Spring Boot, que não sofre nenhuma alteração.

> **Status:** Batch 2 (primeira entrega). Já funcionam:
>
> - login, cadastro de paciente, sessão mantida ao reabrir o app e logout (JWT);
> - a home do profissional com dados reais.
>
> As demais telas ainda são placeholders. O plano completo está em
> [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md).

## Stack

- Expo (managed workflow, SDK 57) + React Native 0.86 + TypeScript `strict`
- React Navigation (native stack + bottom tabs)
- axios + TanStack Query
- `expo-secure-store` (credencial) e AsyncStorage (dados simples)
- `StyleSheet` do React Native, fonte Inter (`@expo-google-fonts/inter`), `react-native-svg` e
  `expo-linear-gradient`. Nenhuma biblioteca de UI.
- Qualidade: ESLint (`eslint-config-expo`) + Prettier, Jest (`jest-expo`) + Testing Library, e2e
  com Maestro

## Estrutura

```
src/
  api/          cliente axios, classificação de erros, QueryClient
  config/       variáveis de ambiente (EXPO_PUBLIC_*)
  services/     chamadas à API por domínio
  hooks/        hooks customizados
  contexts/     AuthContext e outros estados globais
  navigation/   RootNavigator, AuthStack, MainStack
  screens/      uma pasta por tela
  components/   componentes reutilizáveis
  types/        interfaces e models
  theme/        cores, espaçamentos, tipografia (extraídos do Angular)
  utils/        funções puras
.maestro/       fluxos e2e
```

## Pré-requisitos

- **Node.js 20+**. O repositório tem `.nvmrc`, então com nvm basta rodar `nvm use`.
- npm
- Para rodar no Android: **emulador** (Android SDK) **ou** **celular** com o app
  [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) instalado
- Para o e2e: [Maestro CLI](https://maestro.mobile.dev) e Java 17+
- Backend FisioTech rodando e acessível pela rede (veja abaixo)

## Instalação

```bash
nvm use
npm install
cp .env.example .env   # ajuste EXPO_PUBLIC_API_URL
```

## Backend e URL da API

A URL da API vem de `EXPO_PUBLIC_API_URL`, definida no `.env` (que nunca é commitado; use o
[`.env.example`](./.env.example) como modelo). Se a variável não estiver definida, o app usa
`http://10.0.2.2:8080`.

| Onde o app roda  | URL                                                                         |
| ---------------- | --------------------------------------------------------------------------- |
| Emulador Android | `http://10.0.2.2:<porta>` (`10.0.2.2` é o host visto de dentro do emulador) |
| Celular físico   | `http://<IP-do-PC-na-rede>:<porta>` (celular e PC no mesmo Wi-Fi)           |

- Não use `localhost`: dentro do emulador ou do celular, ele aponta para o próprio aparelho.
- Não rode o backend na porta **8081**, que é a porta do Metro (servidor de desenvolvimento
  do Expo).
- Depois de alterar o `.env`, reinicie o Metro com `npx expo start -c`.

## Rodando no emulador Android

1. **Crie o emulador (uma vez só).** Com o Android SDK em `~/Android/Sdk` e as
   _command-line tools_ instaladas:

   ```bash
   export ANDROID_HOME=~/Android/Sdk
   $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "system-images;android-36;google_apis;x86_64"
   $ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n FisioTech_API36 \
     -k "system-images;android-36;google_apis;x86_64" -d pixel_6
   ```

   Pelo Android Studio também funciona: _Device Manager → Create device_.

2. **Abra o emulador:**

   ```bash
   ~/Android/Sdk/emulator/emulator -avd FisioTech_API36
   ```

3. **Suba o app:**

   ```bash
   npm start      # ou: npx expo start
   ```

   Com o Metro no ar, aperte **`a`**. Na primeira vez, o Expo CLI instala o Expo Go no emulador
   e abre o app. Também dá para usar `npm run android`, que já abre direto no emulador.

## Rodando no celular (Expo Go)

1. Instale o **Expo Go** pela Play Store. A versão precisa ser compatível com o SDK 57; a da loja
   é atualizada junto com o SDK.
2. Deixe o celular e o PC na **mesma rede Wi-Fi**.
3. Rode `npm start` no PC e leia o **QR code** exibido no terminal com o Expo Go.
4. Para o app falar com o backend, coloque no `.env` o IP do PC na rede
   (`hostname -I` no Linux, `ipconfig` no Windows).

Se a rede bloquear a conexão entre os aparelhos, use `npx expo start --tunnel`.

> A partir do Batch 2, cada entrega também traz um **APK instalável** para usar o app sem o PC.

## Gerando o APK (instalar sem depender do PC)

A URL da API fica **embutida** no APK. Use o IP, na rede Wi-Fi, do computador que roda o backend.
Com esse IP, o mesmo APK funciona no celular e no emulador.

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:8080 npm run build:apk
```

- O APK sai em `build/fisiotech-<versão>.apk`.
- É um build de release assinado com a chave de debug: serve para testes, não para a Play Store.
- A primeira execução baixa o Gradle e as dependências Android, então demora.
- Requisitos: JDK 17+ e o Android SDK (`ANDROID_HOME`, padrão `~/Android/Sdk`).

Para instalar:

- **Emulador ou celular via USB:** `adb install -r build/fisiotech-1.0.0.apk`.
- **Celular sem cabo:** copie o arquivo para o aparelho e abra. Será preciso permitir
  "instalar apps desconhecidos".

O app usa HTTP em texto puro para falar com o backend local (`usesCleartextTraffic` no
`app.json`). Quando houver um backend com HTTPS, isso deve ser desligado.

## Scripts

| Comando                 | O que faz                                                  |
| ----------------------- | ---------------------------------------------------------- |
| `npm start`             | Sobe o Metro (Expo)                                        |
| `npm run android`       | Sobe o Metro e abre no emulador ou dispositivo Android     |
| `npm run typecheck`     | `tsc --noEmit`                                             |
| `npm run lint`          | ESLint (`expo lint`)                                       |
| `npm run format`        | Prettier (`--write`); `format:check` só verifica           |
| `npm test`              | Testes unitários (Jest), incluindo a suíte de regressão    |
| `npm run test:e2e`      | Fluxos e2e do Maestro (ver abaixo)                         |
| `npm run e2e:seed`      | Cria dados de teste no backend de dev (ver abaixo)         |
| `npm run test:contract` | Testa todos os services contra o backend real (ver abaixo) |
| `npm run build:apk`     | Gera o APK instalável (ver acima)                          |

## Testes

- **Unitários** (`npm test`): arquivos `*.test.ts(x)` ao lado do código, com Jest (`jest-expo`)
  e `@testing-library/react-native`.
- **E2E** (`npm run test:e2e`): fluxos YAML do [Maestro](https://maestro.mobile.dev) em
  `.maestro/`. Relatórios e screenshots ficam em `.maestro/reports/` (ignorado pelo git).
  - `smoke.yaml`: o app abre no login. Não precisa de backend.
  - `auth-profissional.yaml`: passa por senha errada (401), login e home com dados reais, depois
    fecha e reabre o app (a sessão continua) e termina com logout.
  - `cadastro-paciente.yaml`: autocadastro de paciente e email duplicado (409).
  - `apk/profissional-apk.yaml`: o mesmo fluxo do profissional no **APK instalado**
    (`npm run test:e2e -- --apk`, depois de `adb install -r build/*.apk`).
- Instalar o Maestro: <https://docs.maestro.dev/getting-started/installing-maestro>. O binário
  fica em `~/.maestro/bin`; adicione essa pasta ao `PATH`.

### Testes de contrato da API

`npm run test:contract` exercita **todos os services** contra o backend de desenvolvimento, com os
três perfis:

- o admin cria profissionais;
- o profissional cria pacientes, consultas e mensagens;
- o paciente se cadastra, marca, remarca e cancela consulta, conversa e avalia;
- depois vêm as trocas de senha e as exclusões.

Usa as mesmas credenciais de teste do e2e (`.maestro/e2e.local`) e cria dados novos a cada
execução. Fica fora do `npm test` porque depende do backend no ar.

### Rodando o e2e contra o backend real

1. Suba o backend em modo `dev` (veja o README do `fisiotech-back`).
2. Copie `.maestro/e2e.example` para `.maestro/e2e.local` e preencha o admin do backend de dev e
   uma senha de teste. Esse arquivo é ignorado pelo git; **nunca** use credenciais reais nele.
   Não crie arquivos `.env.*` com segredos na raiz: o Metro pode tentar empacotá-los.
3. A cada execução, o `npm run test:e2e` cria um profissional novo, pacientes e consultas de hoje
   (`scripts/e2e-seed.mjs`) e roda os três fluxos.
4. Recomendado no emulador: use `adb reverse`, que é mais estável que o `10.0.2.2` quando o app é
   reaberto várias vezes seguidas:

   ```bash
   adb reverse tcp:8081 tcp:8081 && adb reverse tcp:8080 tcp:8080
   EXPO_PUBLIC_API_URL=http://127.0.0.1:8080 npm start
   npm run test:e2e -- -e METRO_URL=exp://127.0.0.1:8081
   ```

## Fluxo de branches

- `main`: base inicial. A atualização é feita pelo time, por release.
- `dev`: integração. Todos os PRs de migração convergem para cá.
- `feat/migration/batch-XX-*`: uma stack de PRs gerenciada com
  [`gh stack`](https://github.com/github/gh-stack), um batch por camada.
