# FisioTech — App mobile (React Native / Expo)

App Android do sistema de gestão de clínica de fisioterapia **FisioTech**. Este repositório é a
migração do front Angular + Capacitor para **React Native com Expo**. O app consome a mesma API
do backend Java 21 / Spring Boot, que não sofre nenhuma alteração.

> **Status:** Batch 1 (setup) concluído. O app abre numa tela placeholder; login e home do
> profissional entram no Batch 2. O plano completo está em
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

## Scripts

| Comando             | O que faz                                               |
| ------------------- | ------------------------------------------------------- |
| `npm start`         | Sobe o Metro (Expo)                                     |
| `npm run android`   | Sobe o Metro e abre no emulador ou dispositivo Android  |
| `npm run typecheck` | `tsc --noEmit`                                          |
| `npm run lint`      | ESLint (`expo lint`)                                    |
| `npm run format`    | Prettier (`--write`); `format:check` só verifica        |
| `npm test`          | Testes unitários (Jest), incluindo a suíte de regressão |
| `npm run test:e2e`  | Fluxos e2e do Maestro (ver abaixo)                      |

## Testes

- **Unitários** (`npm test`): arquivos `*.test.ts(x)` ao lado do código, com Jest (`jest-expo`)
  e `@testing-library/react-native`.
- **E2E** (`npm run test:e2e`): fluxos YAML do [Maestro](https://maestro.mobile.dev) em
  `.maestro/`. Precisam de um emulador aberto com o Metro rodando (`npm start`). O fluxo abre o
  app no Expo Go via `exp://10.0.2.2:8081`; para outro endereço, use
  `maestro test -e METRO_URL=exp://<ip>:8081 .maestro`. Relatórios e screenshots ficam em
  `.maestro/reports/` (ignorado pelo git).
- Instalar o Maestro: <https://docs.maestro.dev/getting-started/installing-maestro>. O binário
  fica em `~/.maestro/bin`; adicione essa pasta ao `PATH`.

## Fluxo de branches

- `main`: base inicial. A atualização é feita pelo time, por release.
- `dev`: integração. Todos os PRs de migração convergem para cá.
- `feat/migration/batch-XX-*`: uma stack de PRs gerenciada com
  [`gh stack`](https://github.com/github/gh-stack), um batch por camada.
